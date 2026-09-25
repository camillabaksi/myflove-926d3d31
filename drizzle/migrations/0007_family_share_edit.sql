ALTER TABLE public.family_share_areas ADD COLUMN IF NOT EXISTS can_edit boolean NOT NULL DEFAULT false;
GRANT UPDATE ON public.family_share_areas TO authenticated;
CREATE POLICY "Own share areas update" ON public.family_share_areas FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_family_share_permissions()
RETURNS TABLE(owner_id uuid, area text, can_edit boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT DISTINCT fsa.user_id, fsa.area, fsa.can_edit
  FROM public.family_share_areas fsa
  JOIN public.household_members o ON o.user_id = fsa.user_id
  JOIN public.household_members me ON me.household_id = o.household_id AND me.user_id = auth.uid()
  WHERE auth.uid() IS NOT NULL AND fsa.user_id <> auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.family_edit_shared(_owner uuid, _area text, _op text, _item_id text, _title text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); _name text; _key text; _now_ms bigint;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _uid = _owner THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.household_members o JOIN public.household_members me
      ON me.household_id = o.household_id
    WHERE o.user_id = _owner AND me.user_id = _uid
  ) THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.family_share_areas WHERE user_id = _owner AND area = _area AND can_edit
  ) THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT display_name INTO _name FROM public.household_members WHERE user_id = _uid LIMIT 1;
  _now_ms := (extract(epoch from now()) * 1000)::bigint;

  IF _area = 'hem' AND _op = 'toggle' THEN
    IF _item_id IS NULL OR length(_item_id) > 200 THEN RAISE EXCEPTION 'invalid'; END IF;
    UPDATE public.user_kv SET value = CASE WHEN value ? _item_id THEN value - _item_id
      ELSE value || jsonb_build_object(_item_id, to_char(now() AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD')) END
    WHERE user_id = _owner AND key = 'myflove-cleaning-done' AND jsonb_typeof(value) = 'object';
    IF NOT FOUND THEN
      INSERT INTO public.user_kv (user_id, key, value)
      VALUES (_owner, 'myflove-cleaning-done', jsonb_build_object(_item_id, to_char(now() AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD')))
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN;
  END IF;

  IF _op = 'toggle' AND _area IN ('inkop','uppgifter','kalender') THEN
    FOREACH _key IN ARRAY (CASE WHEN _area = 'inkop' THEN ARRAY['myflow-shopping']
      WHEN _area = 'kalender' THEN ARRAY['myflow-tasks','myflow-reminders'] ELSE ARRAY['myflow-tasks'] END) LOOP
      UPDATE public.user_kv kv SET value = (
        SELECT coalesce(jsonb_agg(CASE WHEN e->>'id' = _item_id
          THEN e || jsonb_build_object('completed', NOT coalesce((e->>'completed')::boolean, false), 'editedBy', _name)
          ELSE e END ORDER BY ord), '[]'::jsonb)
        FROM jsonb_array_elements(kv.value) WITH ORDINALITY t(e, ord))
      WHERE kv.user_id = _owner AND kv.key = _key AND jsonb_typeof(kv.value) = 'array';
    END LOOP;
    RETURN;
  END IF;

  IF _op = 'add' AND _area = 'inkop' THEN
    IF _title IS NULL OR length(btrim(_title)) = 0 OR length(_title) > 200 THEN RAISE EXCEPTION 'invalid'; END IF;
    UPDATE public.user_kv SET value = value || jsonb_build_array(jsonb_build_object(
      'id', 'fam-' || gen_random_uuid(), 'title', btrim(_title), 'completed', false, 'createdAt', _now_ms, 'editedBy', _name))
    WHERE user_id = _owner AND key = 'myflow-shopping' AND jsonb_typeof(value) = 'array';
    IF NOT FOUND THEN
      INSERT INTO public.user_kv (user_id, key, value) VALUES (_owner, 'myflow-shopping', jsonb_build_array(jsonb_build_object(
        'id', 'fam-' || gen_random_uuid(), 'title', btrim(_title), 'completed', false, 'createdAt', _now_ms, 'editedBy', _name)))
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN;
  END IF;

  RAISE EXCEPTION 'not allowed';
END $$;

REVOKE ALL ON FUNCTION public.family_edit_shared(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.family_edit_shared(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_share_permissions() TO authenticated;
-- Mottagare: NULL = hela familjen (även framtida medlemmar), annars bara utvalda.
ALTER TABLE public.family_share_areas ADD COLUMN IF NOT EXISTS viewers uuid[];
ALTER TABLE public.child_items ADD COLUMN IF NOT EXISTS share_family boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.same_household(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND _a <> _b AND EXISTS (
    SELECT 1 FROM public.household_members x JOIN public.household_members y ON y.household_id = x.household_id
    WHERE x.user_id = _a AND y.user_id = _b)
$$;

CREATE OR REPLACE FUNCTION public.get_family_shared_data()
 RETURNS TABLE(owner_id uuid, display_name text, color text, area text, key text, value jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH mine AS (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ), others AS (
    SELECT DISTINCT ON (hm.user_id) hm.user_id, hm.display_name, hm.color
    FROM public.household_members hm
    WHERE hm.household_id IN (SELECT household_id FROM mine) AND hm.user_id <> auth.uid()
  ), keymap(area, key) AS (
    VALUES ('kalender','myflow-tasks'), ('kalender','myflow-reminders'),
           ('uppgifter','myflow-tasks'),
           ('inkop','myflow-shopping'), ('inkop','myflow-meal-plans'),
           ('rutiner','myflove-routines'), ('rutiner','myflove-medications'), ('rutiner','myflove-medication-log'), ('rutiner','myflove-done-log'),
           ('traning','myflove-training'),
           ('maende','myflow-moods'), ('maende','myflove-energy-log'),
           ('ekonomi','myflove-budget'), ('ekonomi','myflow-finances'),
           ('studier','myflove-courses'), ('studier','myflove-flowstudy'),
           ('jobb','myflove-work-projects'),
           ('anteckningar','myflow-dump-ideas'),
           ('hem','myflove-cleaning-custom'), ('hem','myflove-cleaning-done'), ('hem','myflove-cleaning-hidden')
  )
  SELECT o.user_id, o.display_name, o.color, fsa.area, kv.key,
    CASE WHEN kv.key = 'myflove-done-log' THEN
      jsonb_build_object(to_char(now() AT TIME ZONE 'Europe/Stockholm','YYYY-MM-DD'),
        coalesce((SELECT jsonb_agg(x) FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(kv.value -> to_char(now() AT TIME ZONE 'Europe/Stockholm','YYYY-MM-DD')) = 'array'
            THEN kv.value -> to_char(now() AT TIME ZONE 'Europe/Stockholm','YYYY-MM-DD') ELSE '[]'::jsonb END) x
          WHERE x LIKE 'routine-%'), '[]'::jsonb))
    ELSE kv.value END
  FROM others o
  JOIN public.family_share_areas fsa ON fsa.user_id = o.user_id
    AND (fsa.viewers IS NULL OR auth.uid() = ANY(fsa.viewers))
  JOIN keymap km ON km.area = fsa.area
  JOIN public.user_kv kv ON kv.user_id = o.user_id AND kv.key = km.key
  WHERE auth.uid() IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.get_family_share_permissions()
 RETURNS TABLE(owner_id uuid, area text, can_edit boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT DISTINCT fsa.user_id, fsa.area,
    (fsa.can_edit AND (fsa.editors IS NULL OR auth.uid() = ANY(fsa.editors)))
  FROM public.family_share_areas fsa
  JOIN public.household_members o ON o.user_id = fsa.user_id
  JOIN public.household_members me ON me.household_id = o.household_id AND me.user_id = auth.uid()
  WHERE auth.uid() IS NOT NULL AND fsa.user_id <> auth.uid()
    AND (fsa.viewers IS NULL OR auth.uid() = ANY(fsa.viewers))
$function$;

-- Redigering kräver också att man är mottagare.
CREATE OR REPLACE FUNCTION public.can_edit_family_area(_owner uuid, _area text, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.family_share_areas WHERE user_id = _owner AND area = _area AND can_edit
    AND (editors IS NULL OR _uid = ANY(editors)) AND (viewers IS NULL OR _uid = ANY(viewers)))
$$;

DO $do$
DECLARE src text;
BEGIN
  src := pg_get_functiondef('public.family_edit_shared'::regproc);
  src := replace(src,
    'SELECT 1 FROM public.family_share_areas WHERE user_id = _owner AND area = _area AND can_edit
      AND (editors IS NULL OR _uid = ANY(editors))',
    'SELECT 1 WHERE public.can_edit_family_area(_owner, _area, _uid)');
  IF position('can_edit_family_area' in src) = 0 THEN RAISE EXCEPTION 'family_edit_shared patch failed'; END IF;
  EXECUTE src;
END $do$;

-- Barnposter delade med hela familjen (gäller även framtida medlemmar). Kopplade barnkonton får
-- aldrig radåtkomst – de får posten via get_my_shared_child_items utan privata anteckningar.
DROP POLICY IF EXISTS "Shared users can view child items" ON public.child_items;
CREATE POLICY "Shared users can view child items" ON public.child_items FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR (
    NOT public.is_child_account_of_owner(owner_id, auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = child_items.id AND s.user_id = auth.uid())
      OR (share_family AND public.same_household(owner_id, auth.uid()))
    )
  )
);

CREATE OR REPLACE FUNCTION public.can_view_child_item(_item_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.child_items i WHERE i.id = _item_id AND i.owner_id = _user_id)
      OR (NOT public.is_child_account_of_owner(public.child_item_owner(_item_id), _user_id)
          AND (EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = _item_id AND s.user_id = _user_id)
               OR EXISTS (SELECT 1 FROM public.child_items i WHERE i.id = _item_id AND i.share_family
                          AND public.same_household(i.owner_id, _user_id))))
$$;

CREATE OR REPLACE FUNCTION public.get_my_shared_child_items()
RETURNS TABLE(id uuid, child_id uuid, owner_id uuid, kind text, title text, notes text, date date, "time" text, completed boolean, repeat text, file_path text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT i.id, i.child_id, i.owner_id, i.kind, i.title,
    CASE WHEN left(i.notes, 16) = '[myflove-visual:' AND strpos(i.notes, ']') > 0
         THEN left(i.notes, strpos(i.notes, ']')) ELSE NULL END,
    i.date, i.time, i.completed, i.repeat, i.file_path, i.created_at, i.updated_at
  FROM public.child_items i
  JOIN public.children c ON c.id = i.child_id
  WHERE auth.uid() IS NOT NULL
    AND i.owner_id <> auth.uid()
    AND public.is_child_account_of_owner(i.owner_id, auth.uid())
    AND (EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = i.id AND s.user_id = auth.uid())
         OR (i.share_family AND public.same_household(i.owner_id, auth.uid())))
    AND NOT (c.account_user_id IS NOT DISTINCT FROM auth.uid() AND i.kind = 'activity')
  ORDER BY i.date NULLS LAST, i.time NULLS LAST
$$;

CREATE OR REPLACE FUNCTION public.can_read_child_doc(_path text, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.can_view_child(((string_to_array(_path, '/'))[1])::uuid, _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i JOIN public.children c ON c.id = i.child_id
                 WHERE i.file_path = _path AND i.kind = 'activity' AND c.account_user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i JOIN public.child_item_shares s ON s.item_id = i.id
                 WHERE i.file_path = _path AND s.user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i
                 WHERE i.file_path = _path AND i.share_family AND public.same_household(i.owner_id, _user_id))
$$;
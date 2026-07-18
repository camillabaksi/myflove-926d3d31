
CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.household_members (
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  color text NOT NULL DEFAULT '#8a9a5b',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated;
GRANT ALL ON public.households TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO authenticated;
GRANT ALL ON public.household_members TO service_role;

CREATE OR REPLACE FUNCTION public.is_household_member(_household_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.household_members WHERE household_id = _household_id AND user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.is_household_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_household_member(uuid, uuid) TO authenticated;

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view household" ON public.households FOR SELECT TO authenticated
  USING (public.is_household_member(id, auth.uid()));
CREATE POLICY "Authenticated can create household" ON public.households FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creator can update household" ON public.households FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Creator can delete household" ON public.households FOR DELETE TO authenticated
  USING (created_by = auth.uid());

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view co-members" ON public.household_members FOR SELECT TO authenticated
  USING (public.is_household_member(household_id, auth.uid()));
CREATE POLICY "Users can join households" ON public.household_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update self in household" ON public.household_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can leave household" ON public.household_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER set_households_updated_at BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.create_household(_name text, _display_name text, _color text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hid uuid; _uid uuid;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.households (name, created_by) VALUES (_name, _uid) RETURNING id INTO _hid;
  INSERT INTO public.household_members (household_id, user_id, display_name, color)
    VALUES (_hid, _uid, _display_name, _color);
  RETURN _hid;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_household(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_household(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_household_by_code(_code text, _display_name text, _color text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _hid uuid; _uid uuid;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT id INTO _hid FROM public.households WHERE invite_code = upper(_code);
  IF _hid IS NULL THEN RAISE EXCEPTION 'invalid invite code'; END IF;
  INSERT INTO public.household_members (household_id, user_id, display_name, color)
    VALUES (_hid, _uid, _display_name, _color)
    ON CONFLICT (household_id, user_id) DO UPDATE
      SET display_name = EXCLUDED.display_name, color = EXCLUDED.color;
  RETURN _hid;
END $$;

REVOKE EXECUTE ON FUNCTION public.join_household_by_code(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_household_by_code(text, text, text) TO authenticated;

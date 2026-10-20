-- Disposable PostgreSQL only: synthetic identities, no production connection.
\set ON_ERROR_STOP on
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated,anon;
CREATE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE SCHEMA storage; CREATE TABLE storage.objects(bucket_id text,name text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT USAGE ON SCHEMA storage TO authenticated; GRANT SELECT ON storage.objects TO authenticated;

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

-- Children module: private per user, shareable per item with chosen family members

CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birthdate date,
  color text NOT NULL DEFAULT '#c17a56',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.child_shares (
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, user_id)
);

CREATE TABLE public.child_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note' CHECK (kind IN ('activity','task','note','doc')),
  title text NOT NULL,
  notes text,
  date date,
  time text,
  completed boolean NOT NULL DEFAULT false,
  remind boolean NOT NULL DEFAULT false,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.child_item_shares (
  item_id uuid NOT NULL REFERENCES public.child_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);

CREATE INDEX idx_child_items_child ON public.child_items(child_id);
CREATE INDEX idx_child_item_shares_user ON public.child_item_shares(user_id);
CREATE INDEX idx_child_shares_user ON public.child_shares(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_item_shares TO authenticated;
GRANT ALL ON public.children TO service_role;
GRANT ALL ON public.child_items TO service_role;
GRANT ALL ON public.child_shares TO service_role;
GRANT ALL ON public.child_item_shares TO service_role;

-- Helpers (security definer, avoids recursive policy evaluation)
CREATE OR REPLACE FUNCTION public.child_owner(_child_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_id FROM public.children WHERE id = _child_id
$$;

CREATE OR REPLACE FUNCTION public.child_item_owner(_item_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_id FROM public.child_items WHERE id = _item_id
$$;

CREATE OR REPLACE FUNCTION public.can_view_child(_child_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.children c WHERE c.id = _child_id AND c.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_shares s WHERE s.child_id = _child_id AND s.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_view_child_item(_item_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.child_items i WHERE i.id = _item_id AND i.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = _item_id AND s.user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.child_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.child_item_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_child(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_child_item(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.child_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.child_item_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_child(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_child_item(uuid, uuid) TO authenticated;

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_item_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own children" ON public.children FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Shared users can view child" ON public.children FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.child_shares s WHERE s.child_id = id AND s.user_id = auth.uid()));

CREATE POLICY "Owner manages own child items" ON public.child_items FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND public.child_owner(child_id) = auth.uid());
CREATE POLICY "Shared users can view child items" ON public.child_items FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = id AND s.user_id = auth.uid()));

CREATE POLICY "Owner manages child shares" ON public.child_shares FOR ALL TO authenticated
  USING (public.child_owner(child_id) = auth.uid()) WITH CHECK (public.child_owner(child_id) = auth.uid());
CREATE POLICY "Recipient can view own child share" ON public.child_shares FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.child_owner(child_id) = auth.uid());

CREATE POLICY "Owner manages child item shares" ON public.child_item_shares FOR ALL TO authenticated
  USING (public.child_item_owner(item_id) = auth.uid()) WITH CHECK (public.child_item_owner(item_id) = auth.uid());
CREATE POLICY "Recipient can view own child item share" ON public.child_item_shares FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.child_item_owner(item_id) = auth.uid());

CREATE TRIGGER trg_children_updated_at BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_child_items_updated_at BEFORE UPDATE ON public.child_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sharing an item also reveals the child profile it belongs to
CREATE OR REPLACE FUNCTION public.share_child_item(_item_id uuid, _user_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  SELECT child_id INTO _cid FROM public.child_items WHERE id = _item_id AND owner_id = auth.uid();
  IF _cid IS NULL THEN RAISE EXCEPTION 'not allowed'; END IF;
  DELETE FROM public.child_item_shares WHERE item_id = _item_id AND NOT (user_id = ANY(_user_ids));
  INSERT INTO public.child_item_shares (item_id, user_id)
    SELECT _item_id, u FROM unnest(_user_ids) u
    ON CONFLICT DO NOTHING;
  INSERT INTO public.child_shares (child_id, user_id)
    SELECT _cid, u FROM unnest(_user_ids) u
    ON CONFLICT DO NOTHING;
END $$;

REVOKE EXECUTE ON FUNCTION public.share_child_item(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.share_child_item(uuid, uuid[]) TO authenticated;
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS helps text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.child_items
  ADD COLUMN IF NOT EXISTS repeat text NOT NULL DEFAULT 'none';
-- Separerar barnets eget konto (user account) från förälderns barnprofil (parent-managed profile).
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS account_user_id uuid;
COMMENT ON COLUMN public.children.account_user_id IS 'Barnets eget inloggade konto. Ger INTE läsrätt till profilen; barnet når bara sin barnvy via get_my_child_profiles/get_my_child_schedule.';
CREATE UNIQUE INDEX IF NOT EXISTS children_owner_account_unique ON public.children(owner_id, account_user_id) WHERE account_user_id IS NOT NULL;

-- Är _uid ett barnkonto kopplat till någon av _owner:s barnprofiler?
CREATE OR REPLACE FUNCTION public.is_child_account_of_owner(_owner uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND _owner IS DISTINCT FROM _uid AND EXISTS (
    SELECT 1 FROM public.children c WHERE c.owner_id = _owner AND c.account_user_id = _uid)
$$;
REVOKE EXECUTE ON FUNCTION public.is_child_account_of_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_child_account_of_owner(uuid, uuid) TO authenticated;

-- Delningsläsning gäller inte barnkonton (varken egen profil eller syskons).
DROP POLICY IF EXISTS "Shared users can view child" ON public.children;
CREATE POLICY "Shared users can view child" ON public.children FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR (
    EXISTS (SELECT 1 FROM public.child_shares s WHERE s.child_id = children.id AND s.user_id = auth.uid())
    AND NOT public.is_child_account_of_owner(owner_id, auth.uid())));

DROP POLICY IF EXISTS "Shared users can view child items" ON public.child_items;
CREATE POLICY "Shared users can view child items" ON public.child_items FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR (
    EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = child_items.id AND s.user_id = auth.uid())
    AND NOT public.is_child_account_of_owner(owner_id, auth.uid())));

CREATE OR REPLACE FUNCTION public.can_view_child(_child_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.children c WHERE c.id = _child_id AND c.owner_id = _user_id)
      OR (EXISTS (SELECT 1 FROM public.child_shares s WHERE s.child_id = _child_id AND s.user_id = _user_id)
          AND NOT public.is_child_account_of_owner(public.child_owner(_child_id), _user_id))
$$;

CREATE OR REPLACE FUNCTION public.can_view_child_item(_item_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.child_items i WHERE i.id = _item_id AND i.owner_id = _user_id)
      OR (EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = _item_id AND s.user_id = _user_id)
          AND NOT public.is_child_account_of_owner(public.child_item_owner(_item_id), _user_id))
$$;

-- Bild till en aktivitet i barnets eget schema får barnkontot öppna; övriga dokument inte.
CREATE OR REPLACE FUNCTION public.can_read_child_doc(_path text, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_view_child(((string_to_array(_path, '/'))[1])::uuid, _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i JOIN public.children c ON c.id = i.child_id
                 WHERE i.file_path = _path AND i.kind = 'activity' AND c.account_user_id = _user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.can_read_child_doc(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_child_doc(text, uuid) TO authenticated;

DROP POLICY IF EXISTS "Viewers can read child docs" ON storage.objects;
CREATE POLICY "Viewers can read child docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'child-docs' AND public.can_read_child_doc(name, auth.uid()));

-- Barnvyn: endast säkra fält, aldrig stödbehov/anteckningar.
CREATE OR REPLACE FUNCTION public.get_my_child_profiles()
RETURNS TABLE(id uuid, owner_id uuid, name text, color text, avatar text, birthdate date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.owner_id, c.name, c.color, c.avatar, c.birthdate
  FROM public.children c
  WHERE auth.uid() IS NOT NULL AND c.account_user_id = auth.uid() AND c.owner_id <> auth.uid()
  ORDER BY c.created_at
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_child_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_child_profiles() TO authenticated;

-- Barnets egna aktiviteter; förälderns privata anteckning efter bildkoden tas bort.
CREATE OR REPLACE FUNCTION public.get_my_child_schedule()
RETURNS TABLE(id uuid, child_id uuid, owner_id uuid, kind text, title text, notes text, date date, "time" text,
              completed boolean, repeat text, file_path text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.child_id, i.owner_id, i.kind, i.title,
    CASE WHEN i.notes LIKE '[visual:%' AND strpos(i.notes, ']') > 0
         THEN left(i.notes, strpos(i.notes, ']')) ELSE NULL END,
    i.date, i.time, i.completed, i.repeat, i.file_path, i.created_at, i.updated_at
  FROM public.child_items i JOIN public.children c ON c.id = i.child_id
  WHERE auth.uid() IS NOT NULL AND c.account_user_id = auth.uid() AND c.owner_id <> auth.uid()
    AND i.kind = 'activity'
  ORDER BY i.created_at DESC
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_child_schedule() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_child_schedule() TO authenticated;
CREATE OR REPLACE FUNCTION public.get_my_child_schedule()
RETURNS TABLE(id uuid, child_id uuid, owner_id uuid, kind text, title text, notes text, date date, "time" text,
              completed boolean, repeat text, file_path text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.child_id, i.owner_id, i.kind, i.title,
    CASE WHEN left(i.notes, 16) = '[myflove-visual:' AND strpos(i.notes, ']') > 0
         THEN left(i.notes, strpos(i.notes, ']')) ELSE NULL END,
    i.date, i.time, i.completed, i.repeat, i.file_path, i.created_at, i.updated_at
  FROM public.child_items i JOIN public.children c ON c.id = i.child_id
  WHERE auth.uid() IS NOT NULL AND c.account_user_id = auth.uid() AND c.owner_id <> auth.uid()
    AND i.kind = 'activity'
  ORDER BY i.created_at DESC
$$;
ALTER TABLE public.child_items ADD COLUMN share_family boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.same_household(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND _a <> _b AND EXISTS (
    SELECT 1 FROM public.household_members x JOIN public.household_members y ON y.household_id = x.household_id
    WHERE x.user_id = _a AND y.user_id = _b)
$$;

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
$$;REVOKE EXECUTE ON FUNCTION public.same_household(uuid,uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.same_household(uuid,uuid) TO authenticated,service_role;
\ir ../../drizzle/migrations/0024_lock_household_membership_child_access.sql
CREATE FUNCTION public.check_test(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',label; END IF; RAISE NOTICE 'PASS: %',label; END $$;
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000004');
INSERT INTO households(id,name,created_by,invite_code) VALUES ('00000000-0000-0000-0000-000000000010','synthetic home','00000000-0000-0000-0000-000000000001','SYNTHETIC'),('00000000-0000-0000-0000-000000000011','outsider home','00000000-0000-0000-0000-000000000004','OTHER');
INSERT INTO household_members(household_id,user_id,display_name) VALUES ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','synthetic-1'),('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000002','synthetic-2'),('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000003','synthetic-3'),('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000004','synthetic-4');
INSERT INTO children(id,owner_id,name,account_user_id,note) VALUES ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000001','linked','00000000-0000-0000-0000-000000000003','SYNTHETIC_PRIVATE'),('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','sibling',NULL,'SYNTHETIC_PRIVATE');
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000001','activity','synthetic-30','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000020/30',false);
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000001','doc','synthetic-31','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000020/31',true);
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','activity','synthetic-32','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000021/32',false);
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','doc','synthetic-33','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000021/33',true);
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','note','synthetic-34','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000021/34',true);
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','task','synthetic-35','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000021/35',true);
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000036','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','activity','synthetic-36','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000021/36',true);
INSERT INTO child_items(id,child_id,owner_id,kind,title,notes,file_path,share_family) VALUES ('00000000-0000-0000-0000-000000000037','00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','activity','synthetic-37','[myflove-visual:star]SYNTHETIC_PRIVATE','00000000-0000-0000-0000-000000000021/37',false);
INSERT INTO child_shares(child_id,user_id) VALUES ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000003');
INSERT INTO child_item_shares(item_id,user_id) VALUES ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000034','00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000035','00000000-0000-0000-0000-000000000003');
INSERT INTO storage.objects SELECT 'child-docs',file_path FROM child_items;
RESET ROLE; SET ROLE authenticated; SET request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
SELECT check_test(((SELECT count(*)=0 FROM children)),'child cannot read raw profiles');
SELECT check_test(((SELECT count(*)=0 FROM child_items)),'child cannot read raw items despite shares');
SELECT check_test(((SELECT count(*)=1 FROM get_my_child_profiles())),'child safe linked profile');
SELECT check_test(((SELECT count(*)=1 FROM get_my_child_schedule())),'child linked activity preserved');
SELECT check_test(((SELECT count(*)=2 FROM get_my_shared_child_items())),'explicit sibling and family activities preserved, own schedule deduplicated');
SELECT check_test((NOT EXISTS (SELECT 1 FROM get_my_shared_child_items() WHERE kind <> 'activity' OR file_path IS NOT NULL OR notes LIKE '%SYNTHETIC_PRIVATE%')),'shared RPC activity-only no file paths or private note suffix');
SELECT check_test((NOT EXISTS (SELECT 1 FROM get_my_child_schedule() WHERE notes LIKE '%SYNTHETIC_PRIVATE%')),'schedule no private note suffix');
SELECT check_test(((SELECT count(*)=1 FROM storage.objects)),'child only linked activity attachment; sibling and private docs blocked');
RESET ROLE; SET ROLE authenticated; SET request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
SELECT check_test(((SELECT count(*)=2 FROM children)),'adult shared profiles preserved');
SELECT check_test(((SELECT count(*)=6 FROM child_items)),'adult explicit and family item reads preserved');
SELECT check_test(((SELECT count(*)=8 FROM storage.objects)),'adult profile document reads preserved');
RESET ROLE; SET ROLE authenticated; SET request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
SELECT check_test(((SELECT count(*)=8 FROM child_items)),'owner full item reads preserved');
RESET ROLE; SET ROLE authenticated; SET request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
SELECT check_test(((SELECT count(*)=0 FROM children)),'outsider no access children');
SELECT check_test(((SELECT count(*)=0 FROM child_items)),'outsider no access child_items');
SELECT check_test(((SELECT count(*)=0 FROM storage.objects)),'outsider no access storage.objects');
SELECT check_test(((SELECT count(*)=0 FROM get_my_child_profiles())),'outsider no access get_my_child_profiles()');
SELECT check_test(((SELECT count(*)=0 FROM get_my_child_schedule())),'outsider no access get_my_child_schedule()');
SELECT check_test(((SELECT count(*)=0 FROM get_my_shared_child_items())),'outsider no access get_my_shared_child_items()');
DO $$ BEGIN BEGIN INSERT INTO household_members(household_id,user_id,display_name) VALUES ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000004','intrusion'); RAISE EXCEPTION 'unauthorized insert succeeded'; EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS: unauthorized direct join rejected'; END; END $$;
DO $$ BEGIN BEGIN UPDATE household_members SET household_id='00000000-0000-0000-0000-000000000010' WHERE user_id=auth.uid(); RAISE EXCEPTION 'move unexpectedly succeeded'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'household membership cannot be moved' THEN RAISE; END IF; RAISE NOTICE 'PASS: membership household_id mutation rejected'; END; END $$;
DO $$ BEGIN BEGIN UPDATE household_members SET user_id='00000000-0000-0000-0000-000000000003' WHERE user_id=auth.uid(); RAISE EXCEPTION 'move unexpectedly succeeded'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'household membership cannot be moved' THEN RAISE; END IF; RAISE NOTICE 'PASS: membership user_id mutation rejected'; END; END $$;
UPDATE household_members SET display_name='renamed',color='#123456' WHERE user_id=auth.uid();
SELECT check_test(((SELECT display_name='renamed' FROM household_members WHERE user_id=auth.uid())),'legitimate self metadata update preserved');
DO $$ BEGIN BEGIN PERFORM join_household_by_code('INVALID','synthetic','#123456'); RAISE EXCEPTION 'invalid invite accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'invalid invite code' THEN RAISE; END IF; RAISE NOTICE 'PASS: invalid invite rejected'; END; END $$;
SELECT check_test((join_household_by_code('SYNTHETIC','synthetic','#123456')='00000000-0000-0000-0000-000000000010'),'legitimate invite join preserved');
SELECT check_test((create_household('synthetic new','synthetic','#123456') IS NOT NULL),'legitimate household creation preserved');
RESET ROLE;

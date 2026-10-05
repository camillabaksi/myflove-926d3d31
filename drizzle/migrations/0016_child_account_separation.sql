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
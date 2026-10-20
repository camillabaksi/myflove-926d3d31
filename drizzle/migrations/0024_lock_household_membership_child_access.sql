DROP POLICY IF EXISTS "Users can join households" ON public.household_members;

CREATE OR REPLACE FUNCTION public.household_members_lock_ids()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.household_id IS DISTINCT FROM OLD.household_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'household membership cannot be moved';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS household_members_lock_ids ON public.household_members;
CREATE TRIGGER household_members_lock_ids BEFORE UPDATE ON public.household_members
  FOR EACH ROW EXECUTE FUNCTION public.household_members_lock_ids();

CREATE OR REPLACE FUNCTION public.can_read_child_doc(_path text, _user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT public.can_view_child(((string_to_array(_path, '/'))[1])::uuid, _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i JOIN public.children c ON c.id = i.child_id
                 WHERE i.file_path = _path AND i.kind = 'activity' AND c.account_user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i JOIN public.child_item_shares s ON s.item_id = i.id
                 WHERE i.file_path = _path AND s.user_id = _user_id
                   AND NOT public.is_child_account_of_owner(i.owner_id, _user_id))
      OR EXISTS (SELECT 1 FROM public.child_items i
                 WHERE i.file_path = _path AND i.share_family AND public.same_household(i.owner_id, _user_id)
                   AND NOT public.is_child_account_of_owner(i.owner_id, _user_id))
$function$;

CREATE OR REPLACE FUNCTION public.get_my_shared_child_items()
 RETURNS TABLE(id uuid, child_id uuid, owner_id uuid, kind text, title text, notes text, date date, "time" text, completed boolean, repeat text, file_path text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT i.id, i.child_id, i.owner_id, i.kind, i.title,
    CASE WHEN left(i.notes, 16) = '[myflove-visual:' AND strpos(i.notes, ']') > 0
         THEN left(i.notes, strpos(i.notes, ']')) ELSE NULL END,
    i.date, i.time, i.completed, i.repeat, NULL::text, i.created_at, i.updated_at
  FROM public.child_items i
  JOIN public.children c ON c.id = i.child_id
  WHERE auth.uid() IS NOT NULL
    AND i.owner_id <> auth.uid()
    AND i.kind = 'activity'
    AND public.is_child_account_of_owner(i.owner_id, auth.uid())
    AND (EXISTS (SELECT 1 FROM public.child_item_shares s WHERE s.item_id = i.id AND s.user_id = auth.uid())
         OR (i.share_family AND public.same_household(i.owner_id, auth.uid())))
    AND NOT (c.account_user_id IS NOT DISTINCT FROM auth.uid() AND i.kind = 'activity')
  ORDER BY i.date NULLS LAST, i.time NULLS LAST
$function$;
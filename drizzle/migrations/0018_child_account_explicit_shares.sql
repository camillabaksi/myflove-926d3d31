-- Uttrycklig delning till ett kopplat barnkonto: endast exakt delade poster, säkra fält,
-- aldrig radåtkomst till children/child_items. Poster som redan finns i barnets egna schema utesluts (ingen dubbelvisning).
CREATE OR REPLACE FUNCTION public.get_my_shared_child_items()
RETURNS TABLE(id uuid, child_id uuid, owner_id uuid, kind text, title text, notes text, date date, "time" text, completed boolean, repeat text, file_path text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT i.id, i.child_id, i.owner_id, i.kind, i.title,
    CASE WHEN left(i.notes, 16) = '[myflove-visual:' AND strpos(i.notes, ']') > 0
         THEN left(i.notes, strpos(i.notes, ']')) ELSE NULL END,
    i.date, i.time, i.completed, i.repeat, i.file_path, i.created_at, i.updated_at
  FROM public.child_item_shares s
  JOIN public.child_items i ON i.id = s.item_id
  JOIN public.children c ON c.id = i.child_id
  WHERE auth.uid() IS NOT NULL
    AND s.user_id = auth.uid()
    AND i.owner_id <> auth.uid()
    AND public.is_child_account_of_owner(i.owner_id, auth.uid())
    AND NOT (c.account_user_id = auth.uid() AND i.kind = 'activity')
  ORDER BY i.date NULLS LAST, i.time NULLS LAST
$$;
REVOKE ALL ON FUNCTION public.get_my_shared_child_items() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_shared_child_items() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_read_child_doc(_path text, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.can_view_child(((string_to_array(_path, '/'))[1])::uuid, _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i JOIN public.children c ON c.id = i.child_id
                 WHERE i.file_path = _path AND i.kind = 'activity' AND c.account_user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.child_items i JOIN public.child_item_shares s ON s.item_id = i.id
                 WHERE i.file_path = _path AND s.user_id = _user_id)
$$;
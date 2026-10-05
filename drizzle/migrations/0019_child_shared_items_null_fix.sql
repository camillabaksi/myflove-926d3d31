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
    AND NOT (c.account_user_id IS NOT DISTINCT FROM auth.uid() AND i.kind = 'activity')
  ORDER BY i.date NULLS LAST, i.time NULLS LAST
$$;
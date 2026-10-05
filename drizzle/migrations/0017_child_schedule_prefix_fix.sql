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
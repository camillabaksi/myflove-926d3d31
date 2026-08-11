CREATE POLICY "Owner can upload child docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'child-docs' AND public.child_owner(((storage.foldername(name))[1])::uuid) = auth.uid());

CREATE POLICY "Owner can update child docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'child-docs' AND public.child_owner(((storage.foldername(name))[1])::uuid) = auth.uid());

CREATE POLICY "Owner can delete child docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'child-docs' AND public.child_owner(((storage.foldername(name))[1])::uuid) = auth.uid());

CREATE POLICY "Viewers can read child docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'child-docs' AND public.can_view_child(((storage.foldername(name))[1])::uuid, auth.uid()));
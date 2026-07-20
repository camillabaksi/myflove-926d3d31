
-- Admin-only access policies for the private 'database_export_20_07_26' bucket.
-- Uses the existing public.has_role(auth.uid(), 'admin') security-definer function.

CREATE POLICY "Admins can read database export files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'database_export_20_07_26'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can upload database export files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'database_export_20_07_26'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update database export files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'database_export_20_07_26'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'database_export_20_07_26'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete database export files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'database_export_20_07_26'
  AND public.has_role(auth.uid(), 'admin')
);

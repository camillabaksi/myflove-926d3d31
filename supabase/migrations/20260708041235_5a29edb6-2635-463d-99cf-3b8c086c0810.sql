
DROP POLICY "Authenticated can update friction items" ON public.friction_items;
CREATE POLICY "Reporter can update own friction item" ON public.friction_items FOR UPDATE TO authenticated USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);

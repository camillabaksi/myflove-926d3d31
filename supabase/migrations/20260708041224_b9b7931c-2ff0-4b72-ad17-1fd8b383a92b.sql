
CREATE TABLE public.friction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  impact SMALLINT NOT NULL DEFAULT 3 CHECK (impact BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','planned','done','ignored')),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friction_items TO authenticated;
GRANT ALL ON public.friction_items TO service_role;
ALTER TABLE public.friction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read friction items" ON public.friction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert friction items" ON public.friction_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Authenticated can update friction items" ON public.friction_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Reporter can delete own friction item" ON public.friction_items FOR DELETE TO authenticated USING (auth.uid() = reporter_id);

CREATE TABLE public.friction_votes (
  item_id UUID NOT NULL REFERENCES public.friction_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.friction_votes TO authenticated;
GRANT ALL ON public.friction_votes TO service_role;
ALTER TABLE public.friction_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read votes" ON public.friction_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "User can insert own vote" ON public.friction_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can delete own vote" ON public.friction_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER friction_items_set_updated_at BEFORE UPDATE ON public.friction_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX friction_items_status_idx ON public.friction_items(status);
CREATE INDEX friction_votes_item_idx ON public.friction_votes(item_id);

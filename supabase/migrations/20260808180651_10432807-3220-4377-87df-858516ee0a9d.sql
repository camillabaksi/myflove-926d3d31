CREATE TABLE public.household_shopping_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hsi_household ON public.household_shopping_items(household_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_shopping_items TO authenticated;
GRANT ALL ON public.household_shopping_items TO service_role;
ALTER TABLE public.household_shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage household shopping items"
  ON public.household_shopping_items FOR ALL TO authenticated
  USING (public.is_household_member(household_id, auth.uid()))
  WITH CHECK (public.is_household_member(household_id, auth.uid()));

CREATE TABLE public.household_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  time text,
  member_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_he_household_date ON public.household_events(household_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_events TO authenticated;
GRANT ALL ON public.household_events TO service_role;
ALTER TABLE public.household_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage household events"
  ON public.household_events FOR ALL TO authenticated
  USING (public.is_household_member(household_id, auth.uid()))
  WITH CHECK (public.is_household_member(household_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_hsi_updated_at BEFORE UPDATE ON public.household_shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_he_updated_at BEFORE UPDATE ON public.household_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.energy_factors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  direction text NOT NULL DEFAULT 'drains',
  strength smallint NOT NULL DEFAULT 3,
  category text NOT NULL DEFAULT 'annat',
  note text,
  counts_toward_score boolean NOT NULL DEFAULT true,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.energy_factors TO authenticated;
GRANT ALL ON public.energy_factors TO service_role;
ALTER TABLE public.energy_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own energy factors" ON public.energy_factors
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX energy_factors_user_time_idx ON public.energy_factors (user_id, occurred_at DESC);

CREATE TABLE public.energy_factor_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  direction text NOT NULL DEFAULT 'drains',
  strength smallint NOT NULL DEFAULT 3,
  category text NOT NULL DEFAULT 'annat',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, title, direction)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.energy_factor_presets TO authenticated;
GRANT ALL ON public.energy_factor_presets TO service_role;
ALTER TABLE public.energy_factor_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own energy presets" ON public.energy_factor_presets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
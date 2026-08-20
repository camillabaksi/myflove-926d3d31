ALTER TABLE public.energy_factors
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'vardag',
  ADD COLUMN IF NOT EXISTS friction smallint;

ALTER TABLE public.energy_factor_presets
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'vardag',
  ADD COLUMN IF NOT EXISTS friction smallint;

CREATE INDEX IF NOT EXISTS energy_factors_user_occurred_idx
  ON public.energy_factors (user_id, occurred_at DESC);
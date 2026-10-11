-- Additiv migration: befintliga påminnelser och RLS-regler behålls.
-- Kör före publicering av den nya push-tick-versionen.
ALTER TABLE public.push_reminders
  ADD COLUMN IF NOT EXISTS sent_endpoints text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS processing_token uuid,
  ADD COLUMN IF NOT EXISTS processing_until timestamptz;

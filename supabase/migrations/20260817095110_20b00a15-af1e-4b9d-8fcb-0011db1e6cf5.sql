ALTER TABLE public.push_preferences
  ADD COLUMN IF NOT EXISTS wake_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wake_time text NOT NULL DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS wake_interval_min integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS wake_max_followups integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS wake_stage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wake_started_on text,
  ADD COLUMN IF NOT EXISTS wake_last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS wake_ack_on text;
ALTER TABLE public.push_preferences
  ADD COLUMN IF NOT EXISTS personal_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS personal_time text NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS personal_evening_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS personal_evening_time text NOT NULL DEFAULT '20:30',
  ADD COLUMN IF NOT EXISTS last_personal_sent_on date;
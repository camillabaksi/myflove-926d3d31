ALTER TABLE public.push_preferences ALTER COLUMN weather_enabled SET DEFAULT false;
ALTER TABLE public.push_preferences ALTER COLUMN personal_enabled SET DEFAULT false;
UPDATE public.push_preferences SET weather_enabled = false, personal_enabled = false;
UPDATE public.push_reminders SET canceled_at = now()
  WHERE delivered_at IS NULL AND canceled_at IS NULL
    AND (client_key LIKE 'flow-%');
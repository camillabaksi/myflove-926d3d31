
-- 1) push_subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subs read"   ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subs insert" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subs update" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subs delete" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

-- 2) push_reminders
CREATE TABLE public.push_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('medication','task','loop','weather','custom')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  deliver_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_reminders TO authenticated;
GRANT ALL ON public.push_reminders TO service_role;
ALTER TABLE public.push_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders read"   ON public.push_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own reminders insert" ON public.push_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reminders update" ON public.push_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reminders delete" ON public.push_reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX push_reminders_due_idx ON public.push_reminders(deliver_at) WHERE delivered_at IS NULL AND canceled_at IS NULL;

-- 3) push_preferences
CREATE TABLE public.push_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_enabled BOOLEAN NOT NULL DEFAULT true,
  tasks_enabled BOOLEAN NOT NULL DEFAULT true,
  loops_enabled BOOLEAN NOT NULL DEFAULT true,
  weather_enabled BOOLEAN NOT NULL DEFAULT true,
  weather_time TEXT NOT NULL DEFAULT '07:00',
  last_lat DOUBLE PRECISION,
  last_lon DOUBLE PRECISION,
  last_weather_check_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_preferences TO authenticated;
GRANT ALL ON public.push_preferences TO service_role;
ALTER TABLE public.push_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs read"   ON public.push_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.push_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.push_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER push_preferences_updated_at
  BEFORE UPDATE ON public.push_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

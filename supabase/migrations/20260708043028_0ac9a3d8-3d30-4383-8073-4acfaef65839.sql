CREATE TABLE public.energy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
  note TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.energy_logs TO authenticated;
GRANT ALL ON public.energy_logs TO service_role;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own energy logs" ON public.energy_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX energy_logs_user_time_idx ON public.energy_logs (user_id, logged_at DESC);
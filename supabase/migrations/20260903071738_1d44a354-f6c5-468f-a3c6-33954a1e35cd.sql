DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_kv'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_kv;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'energy_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_logs;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'energy_factors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_factors;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'energy_factor_presets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.energy_factor_presets;
  END IF;
END $$;
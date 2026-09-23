ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS helps text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS avatar text;
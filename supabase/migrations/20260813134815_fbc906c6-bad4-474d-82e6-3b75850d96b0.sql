ALTER TABLE public.child_items
  ADD COLUMN IF NOT EXISTS repeat text NOT NULL DEFAULT 'none';
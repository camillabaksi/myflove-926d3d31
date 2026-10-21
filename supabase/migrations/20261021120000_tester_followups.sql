-- Admin-only follow-up metadata for tester recruitment.
ALTER TABLE public.tester_applications
  ADD COLUMN IF NOT EXISTS contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS testing_started_at date,
  ADD COLUMN IF NOT EXISTS followup_due_at date,
  ADD COLUMN IF NOT EXISTS last_followup_at date,
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';

-- Existing values are preserved. Extend the existing status constraint.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.tester_applications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.tester_applications DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE public.tester_applications
  ADD CONSTRAINT tester_applications_status_check
  CHECK (status IN ('new', 'contacted', 'invited', 'testing', 'followed_up', 'complete'));

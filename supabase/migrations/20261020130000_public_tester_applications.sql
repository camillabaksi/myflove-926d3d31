-- Recruitment applications are separate from app accounts and app activity.
-- Only the trusted server (service role) can read or write contact details.
CREATE TABLE public.tester_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND char_length(email) <= 254),
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'both', 'web')),
  participation text NOT NULL CHECK (participation IN ('technical', 'everyday', 'both')),
  focus text NOT NULL CHECK (focus IN ('planning', 'energy', 'capture', 'recovery', 'overview', 'general')),
  feedback_willing boolean NOT NULL DEFAULT false,
  consent_version integer NOT NULL DEFAULT 1 CHECK (consent_version = 1),
  consented_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'invited', 'testing', 'complete')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tester_applications_status_created_idx
  ON public.tester_applications(status, created_at DESC);
ALTER TABLE public.tester_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tester_applications FROM PUBLIC, anon, authenticated;
-- No public policies: unauthenticated users submit only through the validated server action.
-- Email addresses are not added to analytics or app user tables.

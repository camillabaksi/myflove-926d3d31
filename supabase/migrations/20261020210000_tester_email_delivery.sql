-- Outgoing transactional-email delivery state, separate from consent and app accounts.
-- "accepted" means the provider accepted the request; it is not delivery proof.
ALTER TABLE public.tester_applications
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'sv'
    CHECK (language IN ('sv', 'en'));
ALTER TABLE public.tester_applications
  ADD COLUMN IF NOT EXISTS confirmation_accepted_at timestamptz;
ALTER TABLE public.tester_applications
  ADD COLUMN IF NOT EXISTS admin_notice_accepted_at timestamptz;

-- Contact information remains available only to the privileged server role.
ALTER TABLE public.tester_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tester_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tester_applications TO service_role;

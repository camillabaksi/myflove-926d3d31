CREATE TABLE public.analytics_session_owners (
  session_id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_internal boolean NOT NULL DEFAULT false,
  note text,
  marked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.analytics_session_owners TO authenticated;
GRANT ALL ON public.analytics_session_owners TO service_role;

ALTER TABLE public.analytics_session_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read session owners"
  ON public.analytics_session_owners FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can claim their own session"
  ON public.analytics_session_owners FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update session owners"
  ON public.analytics_session_owners FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_analytics_session_owners_updated_at
  BEFORE UPDATE ON public.analytics_session_owners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_analytics_session_owners_internal
  ON public.analytics_session_owners (is_internal);
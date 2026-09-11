-- Explicitly deny all API access to encrypted third-party connection keys.
-- Only server-side code using the service role may touch this table.
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_connections FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.app_user_connections FROM anon, authenticated;
GRANT ALL ON public.app_user_connections TO service_role;

DROP POLICY IF EXISTS "No client access to connection keys" ON public.app_user_connections;
CREATE POLICY "No client access to connection keys"
ON public.app_user_connections
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

COMMENT ON TABLE public.app_user_connections IS 'Encrypted OAuth connection keys. No client access: service role only.';
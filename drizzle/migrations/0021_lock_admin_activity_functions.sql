REVOKE EXECUTE ON FUNCTION public.admin_account_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_used_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_account_activity() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_used_activity() TO service_role;
import { supabase } from "@/integrations/supabase/client";

const KEY = "myflove-last-active-ping";
const INTERVAL = 60 * 60 * 1000;

/** Sparar bara tidpunkt för senaste aktivitet för inloggat konto, max en gång i timmen. */
export function touchLastActive(): void {
  if (typeof window === "undefined") return;
  try {
    const last = Number(window.localStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < INTERVAL) return;
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    return;
  }
  void supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
      return;
    }
    void supabase.rpc("touch_last_active").then(() => undefined, () => undefined);
  });
}

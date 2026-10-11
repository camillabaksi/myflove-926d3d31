import { useEffect } from "react";
import {
  ACCOUNT_BOUND_EVENT,
  getSyncUser,
  requestSync,
  useCloudSyncedStorage,
} from "@/lib/cloud-storage";
import { isActiveOwner } from "@/lib/account-scope";
import {
  DEFAULT_QUIET_STATE,
  getQuietMode,
  QUIET_MODE_EVENT,
  QUIET_MODE_KEY,
  setQuietMode,
  type QuietModeState,
} from "@/lib/quiet-mode";

/** Samma kontovärde för pausvyn, Inställningar och serverns bakgrundsnotiser. */
export function useQuietModeSync() {
  const [, setState] = useCloudSyncedStorage<QuietModeState>(QUIET_MODE_KEY, DEFAULT_QUIET_STATE);

  useEffect(() => {
    let alive = true;
    const onChange = (event: Event) => {
      const state = (event as CustomEvent<QuietModeState>).detail;
      if (!state) return;
      setState(state);
      void requestSync(QUIET_MODE_KEY);
    };
    window.addEventListener(QUIET_MODE_EVENT, onChange);
    // Läs kontots värde före zonuppdateringen; skriv aldrig defaults över molnet.
    const updateZone = async () => {
      const user = await getSyncUser();
      if (!user || !alive) return;
      await requestSync(QUIET_MODE_KEY);
      if (!alive || !isActiveOwner(user.id)) return;
      // Saknat lokalt värde kan betyda att första molnläsningen misslyckades.
      // Vänta då; skapa inte ett nytt defaultvärde ovanpå kontots inställningar.
      if (window.localStorage.getItem(QUIET_MODE_KEY) === null) return;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (getQuietMode().timeZone !== timeZone) setQuietMode({ timeZone });
    };
    void updateZone();
    const onOnline = () => {
      void updateZone();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener(ACCOUNT_BOUND_EVENT, onOnline);
    return () => {
      alive = false;
      window.removeEventListener(QUIET_MODE_EVENT, onChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener(ACCOUNT_BOUND_EVENT, onOnline);
    };
  }, [setState]);
}

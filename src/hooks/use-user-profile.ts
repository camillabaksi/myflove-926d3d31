import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncKeyNow, useCloudSyncedStorage } from "@/lib/cloud-storage";

export const NAME_KEY = "myflove-preferred-name";
const LAST_VISIT_KEY = "myflove-last-visit";

function deriveFromEmail(email?: string | null): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0] ?? "";
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function useUserProfile() {
  // Namnet följer kontot mellan enheter. Last visit är däremot en lokal
  // hälsningssignal för just den här enheten och synkas inte.
  const [storedName, setNameState] = useCloudSyncedStorage<string>(NAME_KEY, "");
  // Tillfälligt förslag från kontoprofil/e-post: visas, men sparas aldrig.
  const [suggestion, setSuggestion] = useState("");
  // Under pågående sparning visas det tidigare namnet tills molnet bekräftat.
  const [confirmedDuringSave, setConfirmedDuringSave] = useState<string | null>(null);
  const saveToken = useRef(0);
  const [lastVisit, setLastVisit] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(LAST_VISIT_KEY);
    return raw ? Number(raw) : null;
  });

  useEffect(() => {
    let active = true;
    async function loadSuggestion() {
      if (storedName) return;
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata ?? {};
      const candidate =
        (meta.first_name as string | undefined) ||
        (meta.given_name as string | undefined) ||
        (typeof meta.full_name === "string" ? meta.full_name.split(" ")[0] : "") ||
        (typeof meta.name === "string" ? meta.name.split(" ")[0] : "") ||
        deriveFromEmail(data.user?.email);
      if (active && candidate) setSuggestion(candidate);
    }
    void loadSuggestion();
    return () => {
      active = false;
    };
  }, [storedName]);

  useEffect(() => {
    const prev = localStorage.getItem(LAST_VISIT_KEY);
    if (prev) setLastVisit(Number(prev));
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
  }, []);

  const setName = (value: string) => {
    setNameState(value.trim());
  };

  /** Sparar ett uttryckligt valt namn och väntar på kontots bekräftelse. */
  const saveName = useCallback(
    async (value: string): Promise<boolean> => {
      const next = value.trim();
      if (!next) return false;
      const token = ++saveToken.current;
      const previous = storedName;
      setConfirmedDuringSave((current) => current ?? previous);
      setNameState(next);
      const ok = await syncKeyNow(NAME_KEY);
      if (token !== saveToken.current) return ok; // ett senare val gäller
      if (!ok) setNameState(previous);
      setConfirmedDuringSave(null);
      return ok;
    },
    [storedName, setNameState],
  );

  const shownStored = confirmedDuringSave ?? storedName;
  const name = shownStored || suggestion;
  return { name, hasChosenName: Boolean(shownStored), setName, saveName, lastVisit };
}

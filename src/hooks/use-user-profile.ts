import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

const NAME_KEY = "myflove-preferred-name";
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
  const [name, setNameState] = useCloudSyncedStorage<string>(NAME_KEY, "");
  const [lastVisit, setLastVisit] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(LAST_VISIT_KEY);
    return raw ? Number(raw) : null;
  });

  useEffect(() => {
    let active = true;
    async function loadFromAuth() {
      if (name) return;
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata ?? {};
      const candidate =
        (meta.first_name as string | undefined) ||
        (meta.given_name as string | undefined) ||
        (typeof meta.full_name === "string" ? meta.full_name.split(" ")[0] : "") ||
        (typeof meta.name === "string" ? meta.name.split(" ")[0] : "") ||
        deriveFromEmail(data.user?.email);
      if (active && candidate) setNameState(candidate);
    }
    void loadFromAuth();
    // Bump last-visit timestamp on mount, but keep old value for greeting logic.
    const prev = localStorage.getItem(LAST_VISIT_KEY);
    if (prev) setLastVisit(Number(prev));
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
    return () => {
      active = false;
    };
  }, [name, setNameState]);

  const setName = (value: string) => {
    setNameState(value.trim());
  };

  return { name, setName, lastVisit };
}

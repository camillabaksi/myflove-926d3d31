import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [name, setNameState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(NAME_KEY) ?? "";
  });
  const [lastVisit, setLastVisit] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(LAST_VISIT_KEY);
    return raw ? Number(raw) : null;
  });

  useEffect(() => {
    let active = true;
    async function loadFromAuth() {
      if (localStorage.getItem(NAME_KEY)) return;
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
    loadFromAuth();
    // Bump last-visit timestamp on mount, but keep old value for greeting logic.
    const prev = localStorage.getItem(LAST_VISIT_KEY);
    if (prev) setLastVisit(Number(prev));
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
    return () => {
      active = false;
    };
  }, []);

  const setName = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
    else localStorage.removeItem(NAME_KEY);
    setNameState(trimmed);
  };

  return { name, setName, lastVisit };
}

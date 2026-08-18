import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { matchFriction, type FrictionEntry, type FrictionSuggestion } from "@/lib/friction-match";

// Delad cache: biblioteket ändras sällan och hooken används på flera ställen.
let cached: FrictionEntry[] | null = null;
let inflight: Promise<FrictionEntry[]> | null = null;

async function loadLibrary(): Promise<FrictionEntry[]> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.rpc("get_friction_board");
    const rows = (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      category: r.category as string,
      impact: r.impact as number,
      frequency: r.frequency as number,
      mentalLoad: r.mental_load as number,
      voteCount: Number(r.vote_count ?? 0),
      isMine: Boolean(r.is_mine),
    }));
    cached = rows;
    return rows;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * Friktionsbiblioteket som stödfunktion i resten av appen: det du redan
 * rapporterat som tungt får påverka hur uppgifter rankas och förklaras.
 */
export function useFrictionLibrary(): {
  library: FrictionEntry[];
  loading: boolean;
  suggestFor: (title: string) => FrictionSuggestion | null;
} {
  const [library, setLibrary] = useState<FrictionEntry[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    loadLibrary()
      .then((rows) => {
        if (!cancelled) setLibrary(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestFor = useCallback((title: string) => matchFriction(title, library), [library]);

  return { library, loading, suggestFor };
}

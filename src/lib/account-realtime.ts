import { supabase } from "@/integrations/supabase/client";

export type AccountRealtimeTable =
  | "user_kv"
  | "energy_logs"
  | "energy_factors"
  | "energy_factor_presets";

export interface AccountRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

type Listener = (payload: AccountRealtimePayload) => void;

interface ChannelEntry {
  channel: ReturnType<typeof supabase.channel>;
  listeners: Set<Listener>;
}

const channels = new Map<string, ChannelEntry>();

/**
 * Delar en kanal per tabell och användare mellan hooks. Det håller live-synken
 * billig även när många vyer använder samma user_kv-manifest.
 */
export function subscribeToAccountTable(
  table: AccountRealtimeTable,
  userId: string,
  listener: Listener,
): () => void {
  const key = `${table}:${userId}`;
  let entry = channels.get(key);

  if (!entry) {
    const listeners = new Set<Listener>();
    const channel = supabase
      .channel(`myflove-realtime-${table}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
        (payload) => {
          const normalized: AccountRealtimePayload = {
            eventType: payload.eventType as AccountRealtimePayload["eventType"],
            new: (payload.new ?? {}) as Record<string, unknown>,
            old: (payload.old ?? {}) as Record<string, unknown>,
          };
          listeners.forEach((currentListener) => currentListener(normalized));
        },
      )
      .subscribe();
    entry = { channel, listeners };
    channels.set(key, entry);
  }

  entry.listeners.add(listener);
  return () => {
    const current = channels.get(key);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      channels.delete(key);
      void supabase.removeChannel(current.channel);
    }
  };
}

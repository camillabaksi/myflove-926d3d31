import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import {
  makeConversationTitle,
  normalizeConversationTitle,
  sortConversations,
} from "@/lib/flow-chat-history";

export type FlowRole = "user" | "assistant";

export interface FlowConversation {
  id: string;
  title: string;
  updated_at: string;
}

export interface FlowMessage {
  id: string;
  role: FlowRole;
  content: string;
}

/**
 * Samtal och meddelanden hämtas i omgångar så att även äldre samtal och
 * mycket långa konversationer når fram – ett svarstak får aldrig tyst
 * klippa bort historik.
 */
const PAGE_SIZE = 500;
const MAX_PAGES = 10;

/**
 * Lista över användarens sparade Flow-chattar.
 *
 * Bara titel och senaste aktivitet hämtas här – själva meddelandena laddas
 * först när ett samtal öppnas (se useFlowMessages).
 */
export function useFlowConversations() {
  const [conversations, setConversations] = useState<FlowConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const all: FlowConversation[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const { data, error: err } = await supabase
          .from("flow_conversations")
          .select("id, title, updated_at")
          .order("updated_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (err) throw err;
        const rows = (data as FlowConversation[]) ?? [];
        all.push(...rows);
        if (rows.length < PAGE_SIZE) break;
      }
      setConversations(sortConversations(all));
      setError(null);
    } catch {
      setError("Samtalslistan kunde inte hämtas helt – det som visas kan vara ofullständigt.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      const previous = conversations;
      setConversations((c) => c.filter((x) => x.id !== id));
      const { error: err } = await supabase.from("flow_conversations").delete().eq("id", id);
      if (err) {
        // Misslyckades borttagningen ska samtalet synas igen – aldrig låtsas att det är borta.
        setConversations(previous);
        throw new Error("Samtalet kunde inte tas bort. Försök igen.");
      }
      track("flow_conversation_deleted", { source: "assistant" });
      void refresh();
    },
    [conversations, refresh],
  );

  const rename = useCallback(
    async (id: string, title: string) => {
      const clean = normalizeConversationTitle(title);
      const previous = conversations;
      setConversations((c) => c.map((x) => (x.id === id ? { ...x, title: clean } : x)));
      const { error: err } = await supabase.from("flow_conversations").update({ title: clean }).eq("id", id);
      if (err) {
        setConversations(previous);
        throw new Error("Namnet kunde inte sparas. Försök igen.");
      }
      track("flow_conversation_renamed", { source: "assistant" });
      void refresh();
    },
    [conversations, refresh],
  );

  return { conversations, loading, error, refresh, remove, rename };
}

/** Meddelanden i en specifik chatt. */
export function useFlowMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<FlowMessage[]>([]);
  const [loading, setLoading] = useState(!!conversationId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const all: FlowMessage[] = [];
        for (let page = 0; page < MAX_PAGES; page++) {
          const { data, error: err } = await supabase
            .from("flow_messages")
            .select("id, role, content")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (err) throw err;
          const rows = (data as FlowMessage[]) ?? [];
          all.push(...rows);
          if (rows.length < PAGE_SIZE) break;
        }
        if (cancelled) return;
        setMessages(all);
      } catch {
        if (cancelled) return;
        setError("Samtalet kunde inte hämtas helt – försök öppna det igen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return { messages, setMessages, loading, error };
}

/** Skapar en ny chatt och returnerar dess id. Kastar fel om sparningen misslyckas. */
export async function createFlowConversation(firstMessage: string): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("flow_conversations")
    .insert({ user_id: uid, title: makeConversationTitle(firstMessage) })
    .select("id")
    .single();
  if (error) throw new Error("Samtalet kunde inte sparas. Försök igen.");
  track("flow_conversation_created", { source: "assistant" });
  return data.id as string;
}

/**
 * Sparar ett meddelande i en chatt. Kastar fel om sparningen misslyckas så
 * att anroparen kan visa det och erbjuda återförsök – ett meddelande får
 * aldrig se sparat ut när det inte går att hitta igen.
 */
export async function saveFlowMessage(
  conversationId: string,
  role: FlowRole,
  content: string,
  /** Optional preassigned UUID so approved actions keep a stable origin ID. */
  messageId?: string,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Du verkar inte vara inloggad – meddelandet kunde inte sparas.");
  const { error } = await supabase
    .from("flow_messages")
    .insert({ conversation_id: conversationId, user_id: uid, role, content, ...(messageId ? { id: messageId } : {}) });
  if (error) throw new Error("Meddelandet kunde inte sparas. Försök igen.");
  await supabase
    .from("flow_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

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
 * Lista över användarens sparade Flow-chattar.
 *
 * Bara titel och senaste aktivitet hämtas här – själva meddelandena laddas
 * först när ett samtal öppnas (se useFlowMessages).
 */
export function useFlowConversations() {
  const [conversations, setConversations] = useState<FlowConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("flow_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    setConversations(sortConversations((data as FlowConversation[]) ?? []));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      setConversations((c) => c.filter((x) => x.id !== id));
      await supabase.from("flow_conversations").delete().eq("id", id);
      track("flow_conversation_deleted", { source: "assistant" });
      void refresh();
    },
    [refresh],
  );

  const rename = useCallback(
    async (id: string, title: string) => {
      const clean = normalizeConversationTitle(title);
      setConversations((c) => c.map((x) => (x.id === id ? { ...x, title: clean } : x)));
      await supabase.from("flow_conversations").update({ title: clean }).eq("id", id);
      track("flow_conversation_renamed", { source: "assistant" });
      void refresh();
    },
    [refresh],
  );

  return { conversations, loading, refresh, remove, rename };
}

/** Meddelanden i en specifik chatt. */
export function useFlowMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<FlowMessage[]>([]);
  const [loading, setLoading] = useState(!!conversationId);

  useEffect(() => {
    let cancelled = false;
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      const { data } = await supabase
        .from("flow_messages")
        .select("id, role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setMessages((data as FlowMessage[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return { messages, setMessages, loading };
}

/** Skapar en ny chatt och returnerar dess id. */
export async function createFlowConversation(firstMessage: string): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("flow_conversations")
    .insert({ user_id: uid, title: makeConversationTitle(firstMessage) })
    .select("id")
    .single();
  if (error) return null;
  track("flow_conversation_created", { source: "assistant" });
  return data.id as string;
}

/** Sparar ett meddelande i en chatt. */
export async function saveFlowMessage(
  conversationId: string,
  role: FlowRole,
  content: string,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  const { error } = await supabase
    .from("flow_messages")
    .insert({ conversation_id: conversationId, user_id: uid, role, content });
  if (error) console.error("Kunde inte spara meddelandet:", error.message);
  await supabase
    .from("flow_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

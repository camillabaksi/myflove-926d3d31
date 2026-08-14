import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

function makeTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || "Ny chatt";
}

/** Lista över användarens sparade Flow-chattar. */
export function useFlowConversations() {
  const [conversations, setConversations] = useState<FlowConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("flow_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    setConversations((data as FlowConversation[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      setConversations((c) => c.filter((x) => x.id !== id));
      await supabase.from("flow_conversations").delete().eq("id", id);
      void refresh();
    },
    [refresh],
  );

  return { conversations, loading, refresh, remove };
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
    .insert({ user_id: uid, title: makeTitle(firstMessage) })
    .select("id")
    .single();
  if (error) return null;
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

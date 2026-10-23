import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFlowConversation, saveFlowMessage } from "./use-flow-chats";

/**
 * Chattens sparning ska vara ärlig: ett misslyckat meddelande-insert ska
 * kasta fel (så gränssnittet kan visa det och erbjuda återförsök) och får
 * aldrig uppdatera samtalets tid som om allt gick bra.
 */

const state = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  insertError: null as { message: string } | null,
  conversationError: null as { message: string } | null,
  conversationTouched: false,
  lastMessageInsert: null as unknown,
}));

vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
    },
    from: (table: string) => {
      if (table === "flow_messages") {
        return {
          insert: async (row: unknown) => {
            state.lastMessageInsert = row;
            return { error: state.insertError };
          },
        };
      }
      if (table === "flow_conversations") {
        return {
          insert: () => ({
            select: () => ({
              single: async () =>
                state.conversationError
                  ? { data: null, error: state.conversationError }
                  : { data: { id: "conv-1" }, error: null },
            }),
          }),
          update: () => ({
            eq: async () => {
              state.conversationTouched = true;
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`Oväntad tabell: ${table}`);
    },
  },
}));

beforeEach(() => {
  state.user = { id: "user-1" };
  state.insertError = null;
  state.conversationError = null;
  state.conversationTouched = false;
  state.lastMessageInsert = null;
});

describe("Chattens sparning är ärlig", () => {
  it("persists the same preassigned assistant UUID used by the rendered action card", async () => {
    const messageId = "8734a390-b95c-4981-9c5d-1298534245a2";
    await saveFlowMessage("conv-1", "assistant", "Du kan lägga till uppgiften.", messageId);
    expect(state.lastMessageInsert).toMatchObject({
      id: messageId, conversation_id: "conv-1", user_id: "user-1", role: "assistant",
    });
    expect(state.conversationTouched).toBe(true);
  });

  it("keeps legacy callers working without an explicit message UUID", async () => {
    await saveFlowMessage("conv-1", "user", "hej");
    expect(state.lastMessageInsert).not.toHaveProperty("id");
  });

  it("kastar fel när meddelandet inte går att spara", async () => {
    state.insertError = { message: "nätverksfel" };
    await expect(saveFlowMessage("conv-1", "user", "hej")).rejects.toThrow(/kunde inte sparas/);
  });

  it("uppdaterar inte samtalets tid när meddelandet misslyckades", async () => {
    state.insertError = { message: "nätverksfel" };
    await expect(saveFlowMessage("conv-1", "user", "hej")).rejects.toThrow();
    expect(state.conversationTouched).toBe(false);
  });

  it("kastar fel när användaren inte är inloggad", async () => {
    state.user = null;
    await expect(saveFlowMessage("conv-1", "user", "hej")).rejects.toThrow(/inloggad/);
  });

  it("kastar fel när samtalet inte går att skapa", async () => {
    state.conversationError = { message: "databasfel" };
    await expect(createFlowConversation("första meddelandet")).rejects.toThrow(/kunde inte sparas/);
  });

  it("returnerar null utan att kasta när ingen är inloggad", async () => {
    state.user = null;
    await expect(createFlowConversation("första meddelandet")).resolves.toBeNull();
  });
});

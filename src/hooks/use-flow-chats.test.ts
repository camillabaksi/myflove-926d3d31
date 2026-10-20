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
          insert: async () => ({ error: state.insertError }),
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
});

describe("Chattens sparning är ärlig", () => {
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

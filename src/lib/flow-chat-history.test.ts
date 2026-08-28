import { describe, expect, it } from "vitest";
import {
  makeConversationTitle,
  normalizeConversationTitle,
  relativeDayLabel,
  sortConversations,
} from "@/lib/flow-chat-history";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { sanitizePayload } from "@/lib/analytics-events";
import { isUserDataKey } from "@/lib/local-data";

describe("samtalstitlar", () => {
  it("skapar en kort mänsklig titel från första meddelandet", () => {
    expect(makeConversationTitle("Jag hade en jobbig dag på jobbet idag.")).toBe(
      "Jag hade en jobbig dag på jobbet idag",
    );
  });

  it("faller tillbaka på 'Nytt samtal' utan innehåll", () => {
    expect(makeConversationTitle("  ")).toBe("Nytt samtal");
    expect(makeConversationTitle("hm")).toBe("Nytt samtal");
  });

  it("använder aldrig 'Chat 1'-liknande namn", () => {
    const title = makeConversationTitle("");
    expect(title).not.toMatch(/chat\s*\d|new conversation/i);
  });

  it("klipper långa meddelanden mjukt", () => {
    const title = makeConversationTitle("a".repeat(200));
    expect(title.length).toBeLessThanOrEqual(49);
    expect(title.endsWith("…")).toBe(true);
  });

  it("städar namn användaren själv skriver", () => {
    expect(normalizeConversationTitle("  Jobbet   ")).toBe("Jobbet");
    expect(normalizeConversationTitle("")).toBe("Nytt samtal");
  });
});

describe("relativa datum", () => {
  const now = new Date("2026-08-28T12:00:00");
  it("visar Idag, Igår och I förrgår", () => {
    expect(relativeDayLabel("2026-08-28T08:00:00", now)).toBe("Idag");
    expect(relativeDayLabel("2026-08-27T23:00:00", now)).toBe("Igår");
    expect(relativeDayLabel("2026-08-26T09:00:00", now)).toBe("I förrgår");
  });
  it("visar datum för äldre samtal", () => {
    expect(relativeDayLabel("2026-08-20T09:00:00", now)).toMatch(/20/);
  });
});

describe("sortering", () => {
  it("visar senast använda samtal först", () => {
    const list = [
      { id: "a", title: "A", updated_at: "2026-08-20T10:00:00Z" },
      { id: "b", title: "B", updated_at: "2026-08-28T10:00:00Z" },
      { id: "c", title: "C", updated_at: "2026-08-25T10:00:00Z" },
    ];
    expect(sortConversations(list).map((c) => c.id)).toEqual(["b", "c", "a"]);
  });
});

describe("integritet", () => {
  it("har event för samtalshistoriken", () => {
    for (const name of [
      "flow_conversation_created",
      "flow_conversation_opened",
      "flow_conversation_deleted",
      "flow_conversation_renamed",
    ]) {
      expect(ANALYTICS_EVENTS).toContain(name);
    }
  });

  it("skickar aldrig chattinnehåll som analytics", () => {
    const cleaned = sanitizePayload({
      source: "assistant",
      title: "Jag hade en jobbig dag",
      content: "hemligt",
    } as never);
    expect(cleaned).toEqual({ source: "assistant" });
  });

  it("räknar chattutkast som användardata som rensas vid utloggning", () => {
    expect(isUserDataKey("myflove-flow-draft-abc")).toBe(true);
  });
});

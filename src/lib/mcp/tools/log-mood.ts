import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { readKv, supabaseForUser, writeKv } from "./helpers";

type MoodEntry = {
  id: string;
  score: number;
  note?: string;
  date: number;
};

export default defineTool({
  name: "log_mood",
  title: "Logga humör",
  description: "Loggar en humörsiffra 1–5 (och en valfri notering) för den inloggade användaren.",
  inputSchema: {
    score: z.number().int().min(1).max(5).describe("Humör 1 (tungt) till 5 (fint)."),
    note: z.string().trim().max(500).optional().describe("Valfri kort notering."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ score, note }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ej inloggad." }], isError: true };
    }
    const client = supabaseForUser(ctx.getToken()!);
    const userId = ctx.getUserId()!;
    const moods = await readKv<MoodEntry[]>(client, userId, "myflow-moods", []);
    const entry: MoodEntry = {
      id: Math.random().toString(36).slice(2, 11),
      score,
      note,
      date: Date.now(),
    };
    await writeKv(client, userId, "myflow-moods", [entry, ...moods]);
    return {
      content: [{ type: "text", text: `Loggade humör ${score}/5.` }],
      structuredContent: { entry },
    };
  },
});

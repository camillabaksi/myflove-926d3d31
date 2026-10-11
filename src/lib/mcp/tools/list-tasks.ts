import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { readKv, supabaseForUser } from "./helpers";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
  time?: string;
  snoozedUntil?: string;
};

export default defineTool({
  name: "list_tasks",
  title: "Lista uppgifter",
  description:
    "Listar den inloggade användarens Paceable-uppgifter. Filtrera med `status` (open/completed/all) och begränsa antalet med `limit`.",
  inputSchema: {
    status: z
      .enum(["open", "completed", "all"])
      .default("open")
      .describe("Vilka uppgifter som ska returneras."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .describe("Maxantal uppgifter att returnera."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ej inloggad." }], isError: true };
    }
    const client = supabaseForUser(ctx.getToken()!);
    const tasks = await readKv<Task[]>(client, ctx.getUserId()!, "myflow-tasks", []);
    const today = new Date().toISOString().slice(0, 10);
    const filtered = tasks
      .filter((t) => !t.snoozedUntil || t.snoozedUntil <= today)
      .filter((t) => (status === "all" ? true : status === "open" ? !t.completed : t.completed))
      .slice(0, limit);

    return {
      content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      structuredContent: { tasks: filtered, count: filtered.length },
    };
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { readKv, supabaseForUser, writeKv } from "./helpers";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
  time?: string;
};

export default defineTool({
  name: "add_task",
  title: "Lägg till uppgift",
  description:
    "Skapar en ny uppgift i Paceable för den inloggade användaren. `dueDate` är YYYY-MM-DD och `time` är HH:MM.",
  inputSchema: {
    title: z.string().trim().min(1).max(200).describe("Uppgiftens titel."),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Datum (YYYY-MM-DD)."),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .describe("Klockslag (HH:MM)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ title, dueDate, time }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Ej inloggad." }], isError: true };
    }
    const client = supabaseForUser(ctx.getToken()!);
    const userId = ctx.getUserId()!;
    const tasks = await readKv<Task[]>(client, userId, "myflow-tasks", []);
    const task: Task = {
      id: Math.random().toString(36).slice(2, 11),
      title,
      completed: false,
      createdAt: Date.now(),
      dueDate,
      time,
    };
    await writeKv(client, userId, "myflow-tasks", [task, ...tasks]);
    return {
      content: [{ type: "text", text: `Skapade uppgift: ${title}` }],
      structuredContent: { task },
    };
  },
});

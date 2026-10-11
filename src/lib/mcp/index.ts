import { auth, defineMcp } from "@lovable.dev/mcp-js";
import addTask from "./tools/add-task";
import listTasks from "./tools/list-tasks";
import logMood from "./tools/log-mood";

// Direct Supabase host — the .lovable.cloud proxy is rejected by mcp-js as an
// issuer mismatch. VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "myflove-mcp",
  title: "Paceable",
  version: "0.1.0",
  instructions:
    "Verktyg för Paceable — ditt lugna livsflöde. Använd list_tasks/add_task för användarens uppgifter och log_mood för att logga humör. Alla verktyg agerar som den inloggade användaren.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTasks, addTask, logMood],
});

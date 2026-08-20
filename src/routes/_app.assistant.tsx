import { createFileRoute, redirect } from "@tanstack/react-router";

/** Flow-chatten bor numera i Flow (lagret HJÄLP). Djuplänkar till enskilda
 *  chattar fungerar fortfarande via /assistant/$chatId. */
export const Route = createFileRoute("/_app/assistant")({
  beforeLoad: () => {
    throw redirect({ to: "/flow", replace: true });
  },
});

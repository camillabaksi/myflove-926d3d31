import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/assistant";

/** Flow-chatten – "Prata med Flow" går direkt hit. Djuplänkar till enskilda
 *  chattar fungerar via /assistant/$chatId. */
export const Route = createFileRoute("/_app/assistant")({
  head: () => ({
    meta: [
      { title: "Prata med Flow – MyFlove" },
      {
        name: "description",
        content: "Chatta med Flow, din personliga följeslagare i MyFlove.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

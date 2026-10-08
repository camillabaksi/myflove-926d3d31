import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/assistant";

/** Flow-chatten – "Prata med Flow" går direkt hit. Djuplänkar till enskilda
 *  chattar fungerar via /assistant/$chatId. */
export const Route = createFileRoute("/_app/assistant")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Prata med Flow – MyFlove" },
      { property: "og:description", content: "Chatta med Flow, din personliga följeslagare i MyFlove." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/children";

export const Route = createFileRoute("/_app/barn")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Barn – MyFlove" },
      { property: "og:description", content: "Samla allt om barnen – aktiviteter, att göra, anteckningar och dokument. Privat tills du delar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Barn – MyFlove" },
      {
        name: "description",
        content:
          "Samla allt om barnen – aktiviteter, att göra, anteckningar och dokument. Privat tills du delar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

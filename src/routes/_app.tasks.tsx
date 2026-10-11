import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/tasks";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Uppgifter – Paceable" },
      { property: "og:description", content: "Alla dina uppgifter samlade – lugnt, sorterat och utan press." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Uppgifter – Paceable" },
      {
        name: "description",
        content: "Alla dina uppgifter samlade – lugnt, sorterat och utan press.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

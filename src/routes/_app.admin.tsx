import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Admin – Paceable" },
      { property: "og:description", content: "Adminpanel för att hantera feedback, roller och åtkomst i Paceable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Admin – Paceable" },
      {
        name: "description",
        content: "Adminpanel för att hantera feedback, roller och åtkomst i Paceable.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

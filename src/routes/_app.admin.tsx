import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Admin – MyFlove" },
      { property: "og:description", content: "Adminpanel för att hantera feedback, roller och åtkomst i MyFlove." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Admin – MyFlove" },
      {
        name: "description",
        content: "Adminpanel för att hantera feedback, roller och åtkomst i MyFlove.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

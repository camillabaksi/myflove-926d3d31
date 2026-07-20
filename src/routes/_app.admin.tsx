import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Admin – MyFlove" },
      { name: "description", content: "Adminpanel för att hantera feedback, roller och åtkomst i MyFlove." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

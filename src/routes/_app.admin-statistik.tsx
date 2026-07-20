import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-stats";

export const Route = createFileRoute("/_app/admin-statistik")({
  head: () => ({
    meta: [
      { title: "Adminstatistik – MyFlove" },
      { name: "description", content: "Intern översikt över användarstatistik i MyFlove." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

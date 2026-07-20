import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dashboard";

export const Route = createFileRoute("/_app/fokus")({
  head: () => ({
    meta: [
      { title: "Fokus – MyFlove" },
      { name: "description", content: "En lugn fokusstund med Flow – gör en sak i taget." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

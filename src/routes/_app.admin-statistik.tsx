import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-stats";

export const Route = createFileRoute("/_app/admin-statistik")({
  head: () => ({
    meta: [
      { title: "Adminstatistik – MyFlove" },
      { name: "description", content: "Intern översikt över användarstatistik i MyFlove." },
      { property: "og:title", content: "Adminstatistik – MyFlove" },
      {
        property: "og:description",
        content: "Intern översikt över användarstatistik och marknadsanalys i MyFlove.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

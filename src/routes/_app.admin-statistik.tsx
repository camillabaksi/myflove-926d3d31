import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-stats";

export const Route = createFileRoute("/_app/admin-statistik")({
  head: () => ({
    meta: [
      { title: "Adminstatistik – Paceable" },
      { name: "description", content: "Intern översikt över användarstatistik i Paceable." },
      { property: "og:title", content: "Adminstatistik – Paceable" },
      {
        property: "og:description",
        content: "Intern översikt över användarstatistik och marknadsanalys i Paceable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

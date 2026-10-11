import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/profile";

export const Route = createFileRoute("/_app/profil")({
  head: () => ({
    meta: [
      { title: "Min profil – Paceable" },
      {
        name: "description",
        content:
          "Ditt namn, dina barn och din livsprofil – allt om dig samlat på ett ställe i Paceable.",
      },
      { property: "og:title", content: "Min profil – Paceable" },
      {
        property: "og:description",
        content: "Ditt namn och dina barn – så Paceable känns personligt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

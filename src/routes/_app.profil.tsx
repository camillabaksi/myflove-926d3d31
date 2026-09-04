import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/profile";

export const Route = createFileRoute("/_app/profil")({
  head: () => ({
    meta: [
      { title: "Min profil – MyFlove" },
      {
        name: "description",
        content:
          "Berätta vad du heter och lägg till dina barns namn – så hälsar MyFlove på er rätt överallt i appen.",
      },
      { property: "og:title", content: "Min profil – MyFlove" },
      {
        property: "og:description",
        content: "Ditt namn och dina barn – så MyFlove känns personligt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

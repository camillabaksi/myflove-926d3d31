import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/life-profile";

export const Route = createFileRoute("/_app/min-livsprofil")({
  head: () => ({
    meta: [
      { title: "Min livsprofil – MyFlove" },
      {
        name: "description",
        content:
          "En samlad profil: din livssituation, dina styrkor, dina svårigheter, vad som ger och tar energi och hur du vill att Flow hjälper dig.",
      },
      { property: "og:title", content: "Min livsprofil – MyFlove" },
      {
        property: "og:description",
        content: "En enda profil som gör Flows förslag personliga.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

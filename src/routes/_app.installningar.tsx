import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/settings";

export const Route = createFileRoute("/_app/installningar")({
  head: () => ({
    meta: [
      { title: "Inställningar – Paceable" },
      {
        name: "description",
        content: "Anpassa Paceable, din profil, ditt konto och appens inställningar.",
      },
      { property: "og:title", content: "Inställningar – Paceable" },
      {
        property: "og:description",
        content: "Anpassa Paceable, din profil, ditt konto och appens inställningar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
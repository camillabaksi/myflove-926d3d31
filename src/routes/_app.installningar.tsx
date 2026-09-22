import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/settings";

export const Route = createFileRoute("/_app/installningar")({
  head: () => ({
    meta: [
      { title: "Inställningar – MyFlove" },
      {
        name: "description",
        content: "Anpassa MyFlove, din profil, ditt konto och appens inställningar.",
      },
      { property: "og:title", content: "Inställningar – MyFlove" },
      {
        property: "og:description",
        content: "Anpassa MyFlove, din profil, ditt konto och appens inställningar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});
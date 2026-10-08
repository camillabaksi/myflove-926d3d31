import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/family";

export const Route = createFileRoute("/_app/familj")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Familj – MyFlove" },
      { property: "og:description", content: "Skapa eller gå med i en familj för att dela kalender, inköp och matlista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Familj – MyFlove" },
      {
        name: "description",
        content: "Skapa eller gå med i en familj för att dela kalender, inköp och matlista.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

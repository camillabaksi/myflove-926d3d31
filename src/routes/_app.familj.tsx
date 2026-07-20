import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/family";

export const Route = createFileRoute("/_app/familj")({
  head: () => ({
    meta: [
      { title: "Familj – MyFlove" },
      { name: "description", content: "Skapa eller gå med i en familj för att dela kalender, inköp och matlista." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

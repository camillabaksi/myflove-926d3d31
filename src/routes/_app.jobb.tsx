import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/work";

export const Route = createFileRoute("/_app/jobb")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Jobb – projekt och arbetsuppgifter | MyFlove" },
      { property: "og:description", content: "Samla projekt, arbetsuppgifter, deadlines och dokument – och låt Flow dela upp stora uppdrag i små steg." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Jobb – projekt och arbetsuppgifter | MyFlove" },
      {
        name: "description",
        content:
          "Samla projekt, arbetsuppgifter, deadlines och dokument – och låt Flow dela upp stora uppdrag i små steg.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

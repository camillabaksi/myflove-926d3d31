import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/notes";

export const Route = createFileRoute("/_app/anteckningar")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Anteckningar & idébank – MyFlove" },
      { property: "og:description", content: "Samla tankar och idéer utan krav på åtgärd – omvandla dem till uppgifter eller flytta tillbaka dem till Quickflow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Anteckningar & idébank – MyFlove" },
      {
        name: "description",
        content:
          "Samla tankar och idéer utan krav på åtgärd – omvandla dem till uppgifter eller flytta tillbaka dem till Quickflow.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

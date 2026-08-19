import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/notes";

export const Route = createFileRoute("/_app/anteckningar")({
  head: () => ({
    meta: [
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

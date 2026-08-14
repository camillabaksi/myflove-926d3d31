import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/training";

export const Route = createFileRoute("/_app/traning")({
  head: () => ({
    meta: [
      { title: "Träning – program och steg | MyFlove" },
      {
        name: "description",
        content:
          "Få ett träningsprogram med styrka och kondition utifrån dina mål, och följ dina steg från mobilens hälsoapp.",
      },
      { property: "og:title", content: "Träning – program och steg | MyFlove" },
      {
        property: "og:description",
        content: "Träningsprogram anpassat efter ditt mål, plus stegräkning från hälsoappen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

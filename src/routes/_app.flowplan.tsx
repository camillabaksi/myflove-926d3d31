import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowplan";

export const Route = createFileRoute("/_app/flowplan")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Planera – ordningen på din dag | MyFlove" },
      {
        name: "description",
        content:
          "Planera visar en lugn ordning på dagens saker – och du kan alltid flytta om precis som du vill.",
      },
      { property: "og:title", content: "Planera – ordningen på din dag | MyFlove" },
      {
        property: "og:description",
        content: "Ett förslag på ordning som du själv bestämmer över.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

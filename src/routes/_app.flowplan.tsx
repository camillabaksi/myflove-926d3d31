import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowplan";

export const Route = createFileRoute("/_app/flowplan")({
  head: () => ({
    meta: [
      { title: "Planering – ordningen på din dag | MyFlove" },
      {
        name: "description",
        content:
          "Planeringssidan visar en lugn ordning på dagens saker – och du kan alltid flytta om precis som du vill.",
      },
      { property: "og:title", content: "Planering – ordningen på din dag | MyFlove" },
      {
        property: "og:description",
        content: "Ett förslag på ordning som du själv bestämmer över.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

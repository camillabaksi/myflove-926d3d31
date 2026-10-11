import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowscore";

export const Route = createFileRoute("/_app/flowscore")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Dagens balans – din kapacitet och planering | Paceable" },
      {
        property: "og:description",
        content:
          "Din egen registrerade kapacitet och dagens planering sida vid sida, med samma underlag som Idag och Kalender.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Dagens balans – din kapacitet och planering | Paceable" },
      {
        name: "description",
        content:
          "Din egen registrerade kapacitet och dagens planering sida vid sida, med samma underlag som Idag och Kalender.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

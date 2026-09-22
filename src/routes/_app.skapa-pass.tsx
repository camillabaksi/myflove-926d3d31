import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/workout-builder";

export const Route = createFileRoute("/_app/skapa-pass")({
  head: () => ({
    meta: [
      { title: "Skapa mitt pass – Flow bygger ditt träningspass | MyFlove" },
      {
        name: "description",
        content:
          "Beskriv vad du behöver, så bygger Flow ett träningspass efter din tid, energi, utrustning och det som känns känsligt idag.",
      },
      { property: "og:title", content: "Skapa mitt pass | MyFlove" },
      {
        property: "og:description",
        content: "Ett träningspass som anpassas efter dagens energi och förutsättningar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

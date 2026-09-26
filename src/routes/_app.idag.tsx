import { createFileRoute } from "@tanstack/react-router";
import DayHub from "@/pages/day-hub";

export const Route = createFileRoute("/_app/idag")({
  head: () => ({
    meta: [
      { title: "Idag – dagens planering | MyFlove" },
      {
        name: "description",
        content:
          "Allt som hör till idag på ett ställe: energibatteri, dagens plan och det du redan hunnit med.",
      },
      { property: "og:title", content: "Idag – dagens planering | MyFlove" },
      { property: "og:description", content: "Se vad som behöver hända idag och öppna dagens fördjupning när du vill." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <DayHub tab="idag" />,
});

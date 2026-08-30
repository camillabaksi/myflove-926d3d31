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
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <DayHub tab="idag" />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pitch";

export const Route = createFileRoute("/_app/pitch")({
  head: () => ({
    meta: [
      { title: "Pitchmaterial – MyFlove" },
      {
        name: "description",
        content: "Spela upp MyFloves pitchvideo och ladda ner pitchdecken.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

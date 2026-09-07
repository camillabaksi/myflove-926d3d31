import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/how-are-you";

export const Route = createFileRoute("/_app/hur-mar-du")({
  head: () => ({
    meta: [
      { title: "Hur mår du? – MyFlove" },
      {
        name: "description",
        content:
          "Logga din ork och vad som påverkar dig idag – så vet MyFlove vad du har kapacitet till.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

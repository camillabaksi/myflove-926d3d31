import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dump";

export const Route = createFileRoute("/_app/dump")({
  head: () => ({
    meta: [
      { title: "Brain dump – MyFlove" },
      { name: "description", content: "Töm huvudet snabbt – skriv ner allt du bär på och låt Flow sortera." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/studyflow";

export const Route = createFileRoute("/_app/studyflow")({
  head: () => ({
    meta: [
      { title: "Studier – vad ska jag plugga nu? | MyFlove" },
      {
        name: "description",
        content:
          "Studier visar vad som är rimligt att plugga just nu utifrån deadline, tid, svårighetsgrad och energi – och bygger om dagen när inget blev gjort.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

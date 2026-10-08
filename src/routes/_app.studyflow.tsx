import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/studyflow";

export const Route = createFileRoute("/_app/studyflow")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Studier – vad ska jag plugga nu? | MyFlove" },
      { property: "og:description", content: "Studier visar vad som är rimligt att plugga just nu utifrån deadline, tid, svårighetsgrad och energi – och bygger om dagen när inget blev gjort." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

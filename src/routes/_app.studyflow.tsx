import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/studyflow";

export const Route = createFileRoute("/_app/studyflow")({
  head: () => ({
    meta: [
      { title: "StudyFlow – vad ska jag plugga nu? | MyFlove" },
      {
        name: "description",
        content:
          "StudyFlow visar vad som är rimligt att plugga just nu utifrån deadline, tid, friktion och energi – och bygger om dagen när inget blev gjort.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

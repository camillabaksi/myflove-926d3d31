import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pomodoro";

export const Route = createFileRoute("/_app/pomodoro")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Pomodoro – MyFlove" },
      { property: "og:description", content: "En mjuk pomodoro-timer för fokusstunder – utan stress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Pomodoro – MyFlove" },
      { name: "description", content: "En mjuk pomodoro-timer för fokusstunder – utan stress." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

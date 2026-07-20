import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pomodoro";

export const Route = createFileRoute("/_app/pomodoro")({
  head: () => ({
    meta: [
      { title: "Pomodoro – MyFlove" },
      { name: "description", content: "En mjuk pomodoro-timer för fokusstunder – utan stress." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

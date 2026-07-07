import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/pomodoro";

export const Route = createFileRoute("/_app/pomodoro")({
  component: Page,
});

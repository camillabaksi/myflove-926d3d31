import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/calendar";

export const Route = createFileRoute("/_app/kalender")({
  component: Page,
});

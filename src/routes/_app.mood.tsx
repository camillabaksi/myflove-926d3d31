import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/mood";

export const Route = createFileRoute("/_app/mood")({
  component: Page,
});

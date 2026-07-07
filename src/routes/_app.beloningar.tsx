import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/achievements";

export const Route = createFileRoute("/_app/beloningar")({
  component: Page,
});

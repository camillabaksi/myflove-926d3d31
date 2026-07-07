import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/meal-planner";

export const Route = createFileRoute("/_app/matlista")({
  component: Page,
});

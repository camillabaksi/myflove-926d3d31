import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/travel";

export const Route = createFileRoute("/_app/travel")({
  component: Page,
});

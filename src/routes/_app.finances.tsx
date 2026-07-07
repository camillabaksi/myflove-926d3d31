import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/finances";

export const Route = createFileRoute("/_app/finances")({
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/shopping";

export const Route = createFileRoute("/_app/shopping")({
  component: Page,
});

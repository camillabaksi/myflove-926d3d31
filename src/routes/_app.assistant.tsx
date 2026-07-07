import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/assistant";

export const Route = createFileRoute("/_app/assistant")({
  component: Page,
});

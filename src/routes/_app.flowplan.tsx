import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowplan";

export const Route = createFileRoute("/_app/flowplan")({
  component: Page,
});

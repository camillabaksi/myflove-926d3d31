import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/tasks";

export const Route = createFileRoute("/_app/tasks")({
  component: Page,
});

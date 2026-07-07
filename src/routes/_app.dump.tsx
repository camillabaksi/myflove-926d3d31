import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dump";

export const Route = createFileRoute("/_app/dump")({
  component: Page,
});

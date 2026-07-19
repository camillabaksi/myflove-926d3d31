import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/routines";

export const Route = createFileRoute("/_app/rutiner")({
  component: Page,
});

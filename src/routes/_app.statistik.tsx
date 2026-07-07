import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/stats";

export const Route = createFileRoute("/_app/statistik")({
  component: Page,
});

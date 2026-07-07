import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin-stats";

export const Route = createFileRoute("/_app/admin-statistik")({
  component: Page,
});

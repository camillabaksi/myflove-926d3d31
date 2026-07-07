import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/family";

export const Route = createFileRoute("/_app/familj")({
  component: Page,
});

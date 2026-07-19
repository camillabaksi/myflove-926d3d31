import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/wellness";

export const Route = createFileRoute("/_app/ma-bra")({
  component: Page,
});

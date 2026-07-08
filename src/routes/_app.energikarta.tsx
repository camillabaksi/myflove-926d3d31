import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/energy-map";

export const Route = createFileRoute("/_app/energikarta")({
  component: Page,
});

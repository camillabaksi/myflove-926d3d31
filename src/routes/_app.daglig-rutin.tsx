import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/daily-flow";

export const Route = createFileRoute("/_app/daglig-rutin")({
  component: Page,
});

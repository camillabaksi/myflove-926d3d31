import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/friction-index";

export const Route = createFileRoute("/_app/friktionsindex")({
  component: Page,
});

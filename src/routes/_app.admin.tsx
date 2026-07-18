import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin";

export const Route = createFileRoute("/_app/admin")({
  component: Page,
});

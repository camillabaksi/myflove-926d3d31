import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/medication";

export const Route = createFileRoute("/_app/medicin")({
  component: Page,
});

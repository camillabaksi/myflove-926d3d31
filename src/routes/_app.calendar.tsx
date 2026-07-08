import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/calendar")({
  beforeLoad: () => {
    throw redirect({ to: "/kalender", replace: true });
  },
});
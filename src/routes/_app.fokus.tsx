import { createFileRoute, redirect } from "@tanstack/react-router";

// Fokus är hopslaget med FlowPlan – gamla länkar leds vidare dit.
export const Route = createFileRoute("/_app/fokus")({
  beforeLoad: () => {
    throw redirect({ to: "/flow" });
  },
});

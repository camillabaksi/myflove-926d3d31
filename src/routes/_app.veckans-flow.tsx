import { createFileRoute, redirect } from "@tanstack/react-router";

/** Veckoplanen finns inte längre som egen sektion – gamla länkar går till Översikt. */
export const Route = createFileRoute("/_app/veckans-flow")({
  beforeLoad: () => {
    throw redirect({ to: "/idag", replace: true });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

/** "Min dag" och "Daily Flow" är numera en och samma vy: Idag. */
export const Route = createFileRoute("/_app/min-dag")({
  beforeLoad: () => {
    throw redirect({ to: "/idag", replace: true });
  },
});

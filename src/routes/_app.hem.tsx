import { createFileRoute, redirect } from "@tanstack/react-router";

/** Äldre bokmärken och installerade appar går till den gemensamma startsidan. */
export const Route = createFileRoute("/_app/hem")({
  beforeLoad: () => {
    throw redirect({ to: "/idag", replace: true });
  },
});

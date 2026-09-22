import { createFileRoute, redirect } from "@tanstack/react-router";

/** Äldre länkar till passbyggaren öppnar nu den samlade träningssektionen. */
export const Route = createFileRoute("/_app/skapa-pass")({
  beforeLoad: () => {
    throw redirect({ to: "/traning", replace: true });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * "Hur mår du?" har slagits ihop med Mitt batteri – en enda plats för
 * incheckning. Gamla länkar pekar vidare dit.
 */
export const Route = createFileRoute("/_app/hur-mar-du")({
  beforeLoad: () => {
    throw redirect({ to: "/mitt-batteri" });
  },
});

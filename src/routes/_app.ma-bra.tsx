import { createFileRoute, redirect } from "@tanstack/react-router";

/** "Energi och mående" bor numera i Mitt batteri – en enda plats för incheckning. */
export const Route = createFileRoute("/_app/ma-bra")({
  beforeLoad: () => {
    throw redirect({ to: "/mitt-batteri", replace: true });
  },
});

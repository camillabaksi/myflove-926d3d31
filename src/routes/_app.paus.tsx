import { createFileRoute, redirect } from "@tanstack/react-router";

/** Paus heter numera Återhämtning – gamla länkar leder dit. */
export const Route = createFileRoute("/_app/paus")({
  beforeLoad: () => {
    throw redirect({ to: "/aterhamtning", replace: true });
  },
});

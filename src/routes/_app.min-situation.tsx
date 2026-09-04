import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/min-situation")({
  beforeLoad: () => {
    throw redirect({ to: "/profil" });
  },
});

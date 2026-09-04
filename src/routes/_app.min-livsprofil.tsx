import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/min-livsprofil")({
  beforeLoad: () => {
    throw redirect({ to: "/profil" });
  },
});

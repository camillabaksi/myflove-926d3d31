import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dump")({
  beforeLoad: () => {
    throw redirect({ to: "/quickflow", replace: true });
  },
});

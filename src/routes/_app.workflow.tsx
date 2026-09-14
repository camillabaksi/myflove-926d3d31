import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/workflow")({
  beforeLoad: () => {
    throw redirect({ to: "/jobb" });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/rutiner")({
  beforeLoad: () => {
    throw redirect({ to: "/daglig-rutin", hash: "Rutiner", replace: true });
  },
});

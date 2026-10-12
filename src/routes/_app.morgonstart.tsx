import { createFileRoute, redirect } from "@tanstack/react-router";

/** Morgonstart bor numera bland Rutiner & medicin. */
export const Route = createFileRoute("/_app/morgonstart")({
  beforeLoad: () => {
    throw redirect({ to: "/daglig-rutin", hash: "Morgonstart", replace: true });
  },
});

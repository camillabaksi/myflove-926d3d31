import { createFileRoute, redirect } from "@tanstack/react-router";

/** "Vad ska jag göra nu?" bor numera i Flow (lagret NU). */
export const Route = createFileRoute("/_app/vad-nu")({
  beforeLoad: () => {
    throw redirect({ to: "/flow", replace: true });
  },
});

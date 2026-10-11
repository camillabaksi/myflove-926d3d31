import { createFileRoute, redirect } from "@tanstack/react-router";

/** Blockanpassningen hörde till den pensionerade Hem-sidan. */
export const Route = createFileRoute("/_app/anpassa-hem")({
  beforeLoad: () => {
    throw redirect({ to: "/installningar", replace: true });
  },
});

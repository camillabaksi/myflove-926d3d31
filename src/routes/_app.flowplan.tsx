import { createFileRoute, redirect } from "@tanstack/react-router";

/** FlowPlan™ är numera en del av Flow (lagret IDAG). Logiken lever kvar
 *  i flowplan.functions.ts och används internt. */
export const Route = createFileRoute("/_app/flowplan")({
  beforeLoad: () => {
    throw redirect({ to: "/flow", replace: true });
  },
});

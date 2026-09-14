import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/flowstudy")({
  beforeLoad: () => {
    throw redirect({ to: "/studyflow" });
  },
});

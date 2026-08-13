import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/studier")({
  beforeLoad: () => {
    throw redirect({ to: "/studyflow" });
  },
});

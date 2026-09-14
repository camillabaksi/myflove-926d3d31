import { createFileRoute, redirect } from "@tanstack/react-router";

/** Studiehjälpen bor nu på Studier-sidan – gamla länkar skickas dit. */
export const Route = createFileRoute("/_app/studybuddy")({
  beforeLoad: () => {
    throw redirect({ to: "/studyflow" });
  },
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowstudy";

export const Route = createFileRoute("/_app/studybuddy")({
  head: () => ({
    meta: [
      { title: "Studiehjälp – flashcards och quiz från ditt material | MyFlove" },
      {
        name: "description",
        content:
          "Ladda upp PDF, bilder eller text – Studiehjälp skapar flashcards och quiz, repeterar det du har svårt för och planerar pluggandet inför provet.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

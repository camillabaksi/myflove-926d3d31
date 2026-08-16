import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/what-now";

export const Route = createFileRoute("/_app/vad-nu")({
  head: () => ({
    meta: [
      { title: "Vad ska jag göra nu? | MyFlove" },
      {
        name: "description",
        content:
          "Ett lugnt förslag i taget, utifrån din tid, din energi och dina mål. Börja nu, välj något annat eller skjut upp till imorgon.",
      },
      { property: "og:title", content: "Vad ska jag göra nu? | MyFlove" },
      {
        property: "og:description",
        content: "Ett förslag i taget – aldrig en lista. MyFlove hjälper dig komma igång.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

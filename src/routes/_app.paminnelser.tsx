import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reminders";

export const Route = createFileRoute("/_app/paminnelser")({
  head: () => ({
    meta: [
      { title: "Påminnelser – MyFlove" },
      {
        name: "description",
        content: "Lägg till, ändra och avboka påminnelser med datum, tid och tydlig status.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/npf";

export const Route = createFileRoute("/_app/anpassa")({
  head: () => ({
    meta: [
      { title: "Anpassa appen – MyFlove" },
      {
        name: "description",
        content:
          "Ställ in lugnare färger, färre saker på skärmen, enkla ord och större text i MyFlove.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

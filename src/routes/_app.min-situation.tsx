import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/situation";

export const Route = createFileRoute("/_app/min-situation")({
  head: () => ({
    meta: [
      { title: "Min situation – MyFlove" },
      {
        name: "description",
        content:
          "Välj vilka livssituationer som pågår just nu – jobb, studier, föräldraledig, sjukskriven, arbetssökande eller något annat – så anpassar Flow appens fokus.",
      },
      { property: "og:title", content: "Min situation – MyFlove" },
      {
        property: "og:description",
        content: "Ett övergripande lager som visar var du befinner dig i livet just nu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

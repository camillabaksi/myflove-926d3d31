import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/family-flow";

export const Route = createFileRoute("/_app/familjeflow")({
  head: () => ({
    meta: [
      { title: "Familj – MyFlove" },
      {
        name: "description",
        content: "Få vardagen att fungera för hela familjen – ett rimligt steg i taget.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

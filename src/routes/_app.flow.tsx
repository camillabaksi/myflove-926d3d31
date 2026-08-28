import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flow";

export const Route = createFileRoute("/_app/flow")({
  head: () => ({
    meta: [
      { title: "Flow hjälper – ett nästa steg i taget | MyFlove" },
      {
        name: "description",
        content:
          "Flow hjälper dig att hitta ett lugnt nästa steg när du kört fast, utan att planera hela dagen.",
      },
      { property: "og:title", content: "Flow hjälper – ett nästa steg i taget | MyFlove" },
      {
        property: "og:description",
        content: "Ett lugnt nästa steg när du behöver hjälp att komma vidare.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

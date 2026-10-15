import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dump";

export const Route = createFileRoute("/_app/quickflow")({
  head: () => ({
    meta: [
      { title: "Tankar & Fånga · Paceable" },
      {
        name: "description",
        content:
          "Din privata reflektionsbok med dagbok, beslut, tankekartor och reflektioner. Fånga finns kvar för text, röst och import.",
      },
      { property: "og:title", content: "Tankar & Fånga · Paceable" },
      {
        property: "og:description",
        content:
          "Din privata reflektionsbok och befintlig Fånga, samlade i Paceable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/battery";

export const Route = createFileRoute("/_app/mitt-batteri")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Mitt batteri – MyFlove" },
      { property: "og:description", content: "Se din energinivå just nu, gör en snabb incheckning och öppna historiken när du vill." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Mitt batteri – MyFlove" },
      {
        name: "description",
        content:
          "Se din energinivå just nu, gör en snabb incheckning och öppna historiken när du vill.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

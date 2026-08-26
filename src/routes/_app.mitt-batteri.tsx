import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/battery";

export const Route = createFileRoute("/_app/mitt-batteri")({
  head: () => ({
    meta: [
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

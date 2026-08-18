import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/home";

export const Route = createFileRoute("/_app/hem")({
  head: () => ({
    meta: [
      { title: "Hem – MyFlove" },
      {
        name: "description",
        content: "Din lugna startskärm i MyFlove – väder, dagens saker och genvägar.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

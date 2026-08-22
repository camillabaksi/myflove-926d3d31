import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/home";

export const Route = createFileRoute("/_app/hem")({
  head: () => ({
    meta: [
      { title: "Hem – MyFlove" },
      {
        name: "description",
        content:
          "Din lugna startskärm i MyFlove – se ditt batteri, nästa aktivitet och en rekommendation på ett ögonblick.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

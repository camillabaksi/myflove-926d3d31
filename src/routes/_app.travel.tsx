import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/travel";

export const Route = createFileRoute("/_app/travel")({
  head: () => ({
    meta: [
      { title: "Resa – MyFlove" },
      {
        name: "description",
        content: "Realtidsinfo för resor med SL och ResRobot – planera lugnt.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/stop-paus";

export const Route = createFileRoute("/_app/stop-paus")({
  head: () => ({
    meta: [
      { title: "Stop-paus – MyFlove" },
      {
        name: "description",
        content:
          "En paus mellan impuls och beslut – andas, sätt ord på känslan och välj i lugn och ro.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

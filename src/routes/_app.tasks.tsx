import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/tasks";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "Uppgifter – MyFlove" },
      {
        name: "description",
        content: "Alla dina uppgifter samlade – lugnt, sorterat och utan press.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

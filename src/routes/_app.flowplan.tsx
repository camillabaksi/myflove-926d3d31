import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/flowplan";

export const Route = createFileRoute("/_app/flowplan")({
  head: () => ({
    meta: [
      { title: "FlowPlan – MyFlove" },
      { name: "description", content: "Låt Flow räkna ut rätt ordning på dina uppgifter – utan att pressa dig." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/studies";

export const Route = createFileRoute("/_app/studier")({
  head: () => ({
    meta: [
      { title: "Studier – kurser och inlämningar | MyFlove" },
      {
        name: "description",
        content:
          "Samla kurser, inlämningar, deadlines och dokument – och låt Flow dela upp stora uppgifter i små steg.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

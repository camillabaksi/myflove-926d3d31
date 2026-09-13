import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/home";

export const Route = createFileRoute("/_app/hem")({
  head: () => ({
    meta: [
      { title: "Hem – MyFlove" },
      {
        name: "description",
        content:
          "Din lugna start i MyFlove – fånga en tanke, se kalendern, kolla batteriet eller logga hur du mår.",
      },
      { property: "og:title", content: "Hem – MyFlove" },
      {
        property: "og:description",
        content: "En lugn översikt där du tar en sak i taget.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

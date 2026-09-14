import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/daily-flow";

export const Route = createFileRoute("/_app/daglig-rutin")({
  head: () => ({
    meta: [
      { title: "Rutiner & medicin – MyFlove" },
      { name: "description", content: "Dina fasta rutiner och doser samlade på ett lugnt ställe." },
      { property: "og:title", content: "Rutiner & medicin – MyFlove" },
      { property: "og:description", content: "Dina fasta rutiner och doser samlade på ett lugnt ställe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

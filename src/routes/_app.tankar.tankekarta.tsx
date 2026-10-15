import { createFileRoute } from "@tanstack/react-router";
import NotebookPage from "@/components/notebook/notebook-page";

export const Route = createFileRoute("/_app/tankar/tankekarta")({
  validateSearch: (search: Record<string, unknown>): { entry?: string } => ({
    entry: typeof search.entry === "string" ? search.entry : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tankekarta · Paceable" },
      {
        name: "description",
        content: "Utforska dina tankar och kopplingar i din privata reflektionsbok.",
      },
      { property: "og:title", content: "Tankekarta · Paceable" },
      {
        property: "og:description",
        content: "Utforska dina tankar och kopplingar i din privata reflektionsbok.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <NotebookPage kind="map" />,
});

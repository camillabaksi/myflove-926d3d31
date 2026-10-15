import { createFileRoute } from "@tanstack/react-router";
import NotebookPage from "@/components/notebook/notebook-page";

export const Route = createFileRoute("/_app/tankar/dagbok")({
  validateSearch: (search: Record<string, unknown>): { entry?: string } => ({
    entry: typeof search.entry === "string" ? search.entry : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Dagbok · Paceable" },
      { name: "description", content: "Din privata dagbok med utrymme för dina egna ord." },
      { property: "og:title", content: "Dagbok · Paceable" },
      { property: "og:description", content: "Din privata dagbok med utrymme för dina egna ord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <NotebookPage kind="diary" />,
});

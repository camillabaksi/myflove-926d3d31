import { createFileRoute } from "@tanstack/react-router";
import NotebookPage from "@/components/notebook/notebook-page";

export const Route = createFileRoute("/_app/tankar/beslut")({
  validateSearch: (search: Record<string, unknown>): { entry?: string } => ({
    entry: typeof search.entry === "string" ? search.entry : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Beslut · Paceable" },
      {
        name: "description",
        content: "Dina fördelar, nackdelar och öppna tankar, utan påtvingade slutsatser.",
      },
      { property: "og:title", content: "Beslut · Paceable" },
      {
        property: "og:description",
        content: "Dina fördelar, nackdelar och öppna tankar, utan påtvingade slutsatser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <NotebookPage kind="decision" />,
});

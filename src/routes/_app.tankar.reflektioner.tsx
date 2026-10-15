import { createFileRoute } from "@tanstack/react-router";
import NotebookPage from "@/components/notebook/notebook-page";

export const Route = createFileRoute("/_app/tankar/reflektioner")({
  validateSearch: (search: Record<string, unknown>): { entry?: string } => ({
    entry: typeof search.entry === "string" ? search.entry : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reflektioner · Paceable" },
      {
        name: "description",
        content: "Frivilliga frågor och plats för egen reflektion i Paceable.",
      },
      { property: "og:title", content: "Reflektioner · Paceable" },
      {
        property: "og:description",
        content: "Frivilliga frågor och plats för egen reflektion i Paceable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <NotebookPage kind="reflection" />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/assistant";

export const Route = createFileRoute("/_app/assistant_/$chatId")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Sparat samtal med Flow – MyFlove" },
      { property: "og:description", content: "Läs igenom ett tidigare samtal med Flow, din lugna AI-följeslagare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Sparat samtal med Flow – MyFlove" },
      {
        name: "description",
        content: "Läs igenom ett tidigare samtal med Flow, din lugna AI-följeslagare.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: function AssistantThread() {
    const { chatId } = Route.useParams();
    return <Page chatId={chatId} />;
  },
});

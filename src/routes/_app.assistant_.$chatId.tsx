import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/assistant";

export const Route = createFileRoute("/_app/assistant_/$chatId")({
  head: () => ({
    meta: [
      { title: "Sparat samtal med Flow – MyFlove" },
      { name: "description", content: "Läs igenom ett tidigare samtal med Flow, din lugna AI-följeslagare." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: function AssistantThread() {
    const { chatId } = Route.useParams();
    return <Page chatId={chatId} />;
  },
});

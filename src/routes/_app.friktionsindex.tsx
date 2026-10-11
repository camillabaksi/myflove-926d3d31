import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/friction-index";

export const Route = createFileRoute("/_app/friktionsindex")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Feedback – Paceable" },
      { property: "og:description", content: "Berätta vad som skaver och rösta på vad som ska förbättras i Paceable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Feedback – Paceable" },
      {
        name: "description",
        content: "Berätta vad som skaver och rösta på vad som ska förbättras i Paceable.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

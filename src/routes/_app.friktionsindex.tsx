import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/friction-index";

export const Route = createFileRoute("/_app/friktionsindex")({
  head: () => ({
    meta: [
      { title: "Feedback – MyFlove" },
      { name: "description", content: "Berätta vad som skaver och rösta på vad som ska förbättras i MyFlove." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

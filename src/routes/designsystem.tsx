import { createFileRoute } from "@tanstack/react-router";
import DesignSystemReference from "@/components/paceable/design-system-reference";

export const Route = createFileRoute("/designsystem")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Paceables designsystem – referens" },
    { name: "description", content: "Fristående referens för Paceables godkända sid- och formulärmönster." },
    { property: "og:title", content: "Paceables designsystem – referens" },
    { property: "og:description", content: "Gemensamma ytor, rubriker och tillgängliga formulär utan kontodata." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: DesignSystemReference,
});
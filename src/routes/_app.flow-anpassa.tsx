import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { FlowCustomizePage } from "@/components/flow/flow-personal-pages";
export const Route = createFileRoute("/_app/flow-anpassa")({
  head: () => ({ meta: [{ title: "Anpassa Flow – MyFlove" }, { name: "description", content: "Välj Flows rum och rörelse i din egen takt." }, { property: "og:title", content: "Anpassa Flow – MyFlove" }, { property: "og:description", content: "Gör Flows rum till ditt." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Layout><FlowCustomizePage /></Layout>,
});
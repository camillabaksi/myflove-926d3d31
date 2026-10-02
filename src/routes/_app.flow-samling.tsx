import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { FlowCollectionPage } from "@/components/flow/flow-personal-pages";
export const Route = createFileRoute("/_app/flow-samling")({
  head: () => ({ meta: [{ title: "Min samling – MyFlove" }, { name: "description", content: "Flows tillgängliga rumsteman på ett ställe." }, { property: "og:title", content: "Min samling – MyFlove" }, { property: "og:description", content: "Välj fritt bland Flows rumsteman." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Layout><FlowCollectionPage /></Layout>,
});
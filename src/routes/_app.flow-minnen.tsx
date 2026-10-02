import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { FlowMemoriesPage } from "@/components/flow/flow-personal-pages";
export const Route = createFileRoute("/_app/flow-minnen")({
  head: () => ({ meta: [{ title: "Det här vet Flow om mig – MyFlove" }, { name: "description", content: "Välj själv vad Flow ska komma ihåg." }, { property: "og:title", content: "Det här vet Flow om mig – MyFlove" }, { property: "og:description", content: "Dina egna valda minnen hos Flow." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Layout><FlowMemoriesPage /></Layout>,
});
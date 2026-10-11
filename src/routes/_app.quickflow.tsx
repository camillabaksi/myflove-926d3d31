import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/dump";

export const Route = createFileRoute("/_app/quickflow")({
  head: () => ({
    meta: [
      { title: "Fånga – få ut det ur huvudet | Paceable" },
      {
        name: "description",
        content:
          "Skriv eller prata in allt du bär på. Fånga sorterar det till rätt plats – och håller det som inte får glömmas.",
      },
      { property: "og:title", content: "Fånga – få ut det ur huvudet" },
      {
        property: "og:description",
        content:
          "Snabbfångst för ett fullt huvud. Paceable håller tanken åt dig tills du orkar sortera.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

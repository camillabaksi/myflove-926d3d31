import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/training";

export const Route = createFileRoute("/_app/traning")({
  head: () => ({
    meta: [
      { title: "Träningsprogram – pass, program och historik | MyFlove" },
      {
        name: "description",
        content:
          "Skapa energianpassade pass med Flow, använd färdiga träningsprogram och se sparade och genomförda pass på samma plats.",
      },
      { property: "og:title", content: "Träningsprogram | MyFlove" },
      {
        property: "og:description",
        content: "Flow-pass, färdiga program och träningshistorik samlat i en lugn träningssektion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

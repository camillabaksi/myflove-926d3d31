import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./integritet";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookiepolicy – MyFlove" },
      {
        name: "description",
        content:
          "MyFlove använder bara nödvändig lokal lagring – ingen spårning, inga marknadscookies.",
      },
      { property: "og:title", content: "Cookiepolicy – MyFlove" },
      {
        property: "og:description",
        content:
          "MyFlove använder bara nödvändig lokal lagring – ingen spårning, inga marknadscookies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cookiepolicy – MyFlove" },
      { property: "og:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "MyFlove – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:url", content: "https://myflove.lovable.app/cookies" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalShell title="Cookies & lokal lagring" updated="18 juli 2026">
      <p>
        MyFlove är byggd för att vara lugn – även tekniskt. Vi använder inga marknadscookies, inga
        tredjepartsspårare och inga annonsnätverk.
      </p>

      <h2>Vad vi använder</h2>
      <ul>
        <li>
          <strong>Nödvändig lokal lagring (localStorage):</strong> för att komma ihåg dig som
          inloggad, dina inställningar (t.ex. genvägar och volym) och lokala uppgifter som matlista
          och FlowPlan.
        </li>
        <li>
          <strong>Sessionscookie från vår auth-leverantör:</strong> för att hålla dig inloggad på
          ett säkert sätt.
        </li>
        <li>
          <strong>Anonym användningsstatistik:</strong> aggregerad information om vilka funktioner
          som används, utan att koppla det till en identifierbar person i marknadsföringssyfte.
        </li>
      </ul>

      <h2>Vad vi inte använder</h2>
      <ul>
        <li>Inga annonscookies.</li>
        <li>Ingen spårning över andra webbplatser.</li>
        <li>Ingen försäljning av data till tredje part.</li>
      </ul>

      <h2>Ditt val</h2>
      <p>
        Eftersom vi bara använder tekniskt nödvändig lagring behöver vi inte fråga om samtycke
        enligt LEK. Du kan alltid rensa lagringen i din webbläsare, eller radera ditt konto helt.
      </p>
    </LegalShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./integritet";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookiepolicy – Paceable" },
      {
        name: "description",
        content:
          "Paceable använder bara nödvändig lokal lagring – ingen spårning, inga marknadscookies.",
      },
      { property: "og:title", content: "Cookiepolicy – Paceable" },
      {
        property: "og:description",
        content:
          "Paceable använder bara nödvändig lokal lagring – ingen spårning, inga marknadscookies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cookiepolicy – Paceable" },
      { property: "og:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Paceable – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:url", content: "https://myflove.lovable.app/cookies" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalShell title="Cookies & lokal lagring" updated="28 augusti 2026">
      <p>
        Paceable är byggd för att vara lugn – även tekniskt. Vi använder inga marknadscookies, inga
        tredjepartsspårare och inga annonsnätverk.
      </p>

      <h2>Vad vi använder</h2>
      <ul>
        <li>
          <strong>Nödvändig lokal lagring (localStorage):</strong> för att komma ihåg dig som
          inloggad, dina inställningar (t.ex. genvägar, textstorlek och tema) och lokala uppgifter
          som matlista och Planering.
        </li>
        <li>
          <strong>Krypterad lokal lagring:</strong> det känsligaste – energi, mående, medicin och
          ekonomi – sparas krypterat (AES-GCM) med en nyckel i enhetens säkra lagring (IndexedDB).
          Vid utloggning raderas nyckeln och den lokala datan.
        </li>
        <li>
          <strong>Sessionslagring:</strong> tillfälligt, t.ex. påbörjad text i en chatt med Pace.
          Den försvinner när du stänger fliken eller loggar ut.
        </li>
        <li>
          <strong>Sessionscookie från vår auth-leverantör:</strong> för att hålla dig inloggad på
          ett säkert sätt.
        </li>
        <li>
          <strong>Avidentifierad användningsstatistik:</strong> aggregerad information om vilka
          funktioner som används. Innehåll filtreras bort – vi skickar aldrig text, mående-värden,
          belopp eller medicinnamn.
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
        enligt LEK. Den anonyma användningsstatistiken kan du när som helst stänga av under{" "}
        <strong>Anpassa appen → Integritet</strong>. Du kan också rensa lagringen i din webbläsare,
        logga ut (då rensas den lokala datan på enheten), eller radera ditt konto helt i appen.
      </p>
    </LegalShell>
  );
}

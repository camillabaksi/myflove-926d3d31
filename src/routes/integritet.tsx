import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/integritet")({
  head: () => ({
    meta: [
      { title: "Integritetspolicy – MyFlove" },
      {
        name: "description",
        content:
          "Så hanterar MyFlove dina personuppgifter enligt GDPR – vilka data vi samlar, varför, hur länge och dina rättigheter.",
      },
      { property: "og:title", content: "Integritetspolicy – MyFlove" },
      {
        property: "og:description",
        content:
          "Så hanterar MyFlove dina personuppgifter enligt GDPR – vilka data vi samlar, varför och dina rättigheter.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://myflove.lovable.app/integritet" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/integritet" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell title="Integritetspolicy" updated="18 juli 2026">
      <p>
        MyFlove är byggd för att minska mental belastning – och det gäller även dina
        personuppgifter. Vi samlar in så lite som möjligt, förklarar varför, och du bestämmer alltid
        själv. Denna policy beskriver hur vi behandlar dina uppgifter i enlighet med EU:s
        dataskyddsförordning (GDPR).
      </p>

      <h2>Personuppgiftsansvarig</h2>
      <p>
        MyFlove ansvarar för behandlingen av dina personuppgifter. Kontakt:{" "}
        <a href="mailto:camillabaksi@hotmail.com">camillabaksi@hotmail.com</a>.
      </p>

      <h2>Vilka uppgifter vi behandlar</h2>
      <ul>
        <li>
          <strong>Kontouppgifter:</strong> e-postadress och krypterat lösenord när du skapar konto.
        </li>
        <li>
          <strong>Innehåll du skapar:</strong> uppgifter, humör, energinivåer, matlistor,
          kalenderposter och reflektioner – lagras kopplat till ditt konto.
        </li>
        <li>
          <strong>Enhets- och användningsdata:</strong> anonymiserad statistik om vilka funktioner
          som används, för att kunna förbättra appen.
        </li>
        <li>
          <strong>Plats (frivilligt):</strong> ungefärlig plats används endast för väder och
          reseinformation, direkt i din enhet – vi lagrar den inte.
        </li>
      </ul>

      <h2>Varför vi behandlar dem (rättslig grund)</h2>
      <ul>
        <li>
          <strong>Avtal:</strong> för att leverera tjänsten du valt att använda.
        </li>
        <li>
          <strong>Samtycke:</strong> för valfria funktioner som notifikationer, plats och
          AI-assistent.
        </li>
        <li>
          <strong>Berättigat intresse:</strong> för säkerhet, felsökning och anonymiserad
          produktstatistik.
        </li>
      </ul>

      <h2>Var dina uppgifter lagras</h2>
      <p>
        Uppgifterna lagras hos vår molnleverantör inom EU (Supabase / AWS Europe). AI-svar genereras
        via Lovable AI Gateway och skickas då i förekommande fall till underleverantörer såsom
        Google (Gemini). Inga uppgifter säljs vidare.
      </p>

      <h2>Hur länge vi sparar</h2>
      <p>
        Ditt konto och tillhörande innehåll sparas så länge du har ett aktivt konto. Du kan när som
        helst radera hela ditt konto och all data via{" "}
        <a href="mailto:camillabaksi@hotmail.com">camillabaksi@hotmail.com</a>.
      </p>

      <h2>Dina rättigheter enligt GDPR</h2>
      <ul>
        <li>Rätt till tillgång, rättelse och radering av dina uppgifter.</li>
        <li>Rätt att invända mot eller begränsa behandling.</li>
        <li>Rätt till dataportabilitet.</li>
        <li>Rätt att återkalla samtycke när som helst.</li>
        <li>Rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY).</li>
      </ul>

      <h2>Cookies och lokal lagring</h2>
      <p>
        MyFlove använder endast nödvändig lokal lagring i webbläsaren för att komma ihåg dig som
        inloggad och dina inställningar. Vi använder inga cookies för marknadsföring eller
        tredjepartsspårning. Läs mer i <Link to="/cookies">cookiepolicyn</Link>.
      </p>

      <h2>Ändringar</h2>
      <p>
        Vi kan komma att uppdatera denna policy. Vid större ändringar meddelar vi dig i appen innan
        de träder i kraft.
      </p>
    </LegalShell>
  );
}

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F8F5FE] text-[#2A2140] px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-[#7C5CE0] font-semibold">
          ← MyFlove
        </Link>
        <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
        <p className="mt-2 text-sm text-[#6B647F]">Senast uppdaterad: {updated}</p>
        <article className="mt-10 space-y-4 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-[#7C5CE0] [&_a]:underline">
          {children}
        </article>
        <div className="mt-16 flex gap-4 text-sm">
          <Link to="/integritet" className="text-[#7C5CE0] underline">
            Integritet
          </Link>
          <Link to="/villkor" className="text-[#7C5CE0] underline">
            Villkor
          </Link>
          <Link to="/cookies" className="text-[#7C5CE0] underline">
            Cookies
          </Link>
        </div>
      </div>
    </main>
  );
}

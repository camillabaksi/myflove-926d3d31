import { PUBLIC_BASE_URL } from "@/lib/public-url";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/integritet")({
  head: () => ({
    meta: [
      { title: "Integritetspolicy – Paceable" },
      {
        name: "description",
        content:
          "Så hanterar Paceable dina personuppgifter enligt GDPR – vilka data vi samlar, varför, hur länge och dina rättigheter.",
      },
      { property: "og:title", content: "Integritetspolicy – Paceable" },
      {
        property: "og:description",
        content:
          "Så hanterar Paceable dina personuppgifter enligt GDPR – vilka data vi samlar, varför och dina rättigheter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Integritetspolicy – Paceable" },
      { property: "og:image", content: `${PUBLIC_BASE_URL}/og-image.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Paceable – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: `${PUBLIC_BASE_URL}/og-image.jpg` },
      { property: "og:url", content: `${PUBLIC_BASE_URL}/integritet` },
    ],
    links: [{ rel: "canonical", href: `${PUBLIC_BASE_URL}/integritet` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell title="Integritetspolicy" updated="20 oktober 2026">
      <p>
        Paceable är byggd för att minska mental belastning – och det gäller även dina
        personuppgifter. Vi samlar in så lite som möjligt, förklarar varför, och du bestämmer alltid
        själv. Denna policy beskriver hur vi behandlar dina uppgifter i enlighet med EU:s
        dataskyddsförordning (GDPR).
      </p>

      <h2>Personuppgiftsansvarig</h2>
      <p>
        Paceable ansvarar för behandlingen av dina personuppgifter. Kontakt:{" "}
        <a href="mailto:kontakt@paceable.se">kontakt@paceable.se</a>.
      </p>

      <h2>Vilka uppgifter vi behandlar</h2>
      <ul>
        <li>
          <strong>Kontouppgifter:</strong> e-postadress och krypterat lösenord när du skapar konto.
          Loggar du in med Google får vi din e-postadress och ditt namn från Google.
          Vi sparar också om kontot skapades i iOS-appen, Androidappen eller webbappen,
          för att kunna följa antalet registrerade konton per plattform.
        </li>
        <li>
          <strong>Innehåll du skapar:</strong> uppgifter, rutiner, kalenderposter, anteckningar,
          inköpslistor, matlistor, studie- och jobbmaterial samt reflektioner – lagras kopplat till
          ditt konto.
        </li>
        <li>
          <strong>Hälsorelaterad information (särskild kategori):</strong> energi, mående, medicin
          och liknande som du själv väljer att logga. Den behandlas bara för att du uttryckligen
          valt att använda funktionen, och de känsligaste posterna lagras dessutom krypterat lokalt
          på din enhet (AES-GCM, med nyckeln i enhetens säkra lagring).
        </li>
        <li>
          <strong>Samtal med Pace:</strong> sparade chattar med AI-följeslagaren Pace lagras kopplat
          till ditt konto tills du raderar dem. Påbörjad text ligger bara kvar under sessionen.
        </li>
        <li>
          <strong>Delat innehåll:</strong> om du använder hushåll/relationer delas det du aktivt
          delar (t.ex. inköpslista och kalender) med de personer du bjudit in.
        </li>
        <li>
          <strong>Enhets- och användningsdata:</strong> avidentifierad statistik om vilka funktioner
          som används. Vi filtrerar bort innehåll – aldrig text, mående-värden, belopp eller
          medicinnamn.
        </li>
        <li>
          <strong>Notiser (frivilligt):</strong> en teknisk push-prenumeration för din enhet, så att
          påminnelser kan levereras.
        </li>
        <li>
          <strong>Plats (frivilligt):</strong> ungefärlig plats används endast för väder, promenader
          och reseinformation, direkt i din enhet – vi lagrar den inte.
        </li>
      </ul>

      <h2>Varför vi behandlar dem (rättslig grund)</h2>
      <ul>
        <li>
          <strong>Avtal:</strong> för att leverera tjänsten du valt att använda.
        </li>
        <li>
          <strong>Uttryckligt samtycke:</strong> för hälsorelaterad loggning (energi, mående,
          medicin) enligt artikel 9.2 a GDPR.
        </li>
        <li>
          <strong>Samtycke:</strong> för valfria funktioner som notiser, plats och AI-assistent.
        </li>
        <li>
          <strong>Berättigat intresse:</strong> för säkerhet, felsökning och avidentifierad
          produktstatistik.
        </li>
      </ul>

      <h2>Intresseanmälan som testare</h2>
      <p>
        Om du anmäler intresse via <Link to="/testa">Bli testare</Link> behandlar vi din
        mejladress, val av plattform, vilket slags test du vill bidra till och vad du helst
        vill prova. Vi sparar även om du vill lämna feedback och när du gav ditt samtycke.
        Inga uppgifter om diagnos eller hälsotillstånd efterfrågas i formuläret.
      </p>
      <p>
        Rättslig grund är ditt samtycke. Uppgifterna används endast för att kontakta dig
        om testplatser, inbjudningar och frivillig återkoppling, inte för marknadsföring.
        Anmälningarna hålls åtskilda från appkonton och användningsstatistik och kan bara
        ses av behöriga administratörer. De sparas under rekryteringen och den aktuella
        testperioden, eller tills du ber oss radera dem. Återkalla samtycket eller be
        om utdrag eller radering via <a href="mailto:kontakt@paceable.se">kontakt@paceable.se</a>.
      </p>

      <h2>Frivillig veckopuls</h2>
      <p>
        Den frivilliga veckopulsen har tre frågor om hur Paceable känns att använda. När du väljer
        Svara sparar vi att veckopulsen har startats för ditt konto och aktuell vecka. Inte nu
        sparar ett val att pausa frågan resten av veckan. Dina tre svar på skalan 1–5 sparas först
        när du väljer Skicka mina svar. Påbörjade svar skickas inte.
      </p>
      <p>
        Inskickade svar, vecka, tidpunkt och versionen av informationen du godkände kopplas till
        ditt konto, så att du kan ändra svaren och räknas en gång per vecka. Syftet är att förbättra
        Paceable. Grundarens adminvy visar endast sammanställda antal, svarsfördelningar och
        medianer utan namn. Veckopulsen kopplas inte till anonyma användnings-ID, privata planer,
        energiloggar eller AI-samtal. Det är frivilligt att svara och påverkar inte din tillgång
        till appen. Du kan ändra eller ta bort den aktuella veckans svar i veckopulsen.
      </p>
      <p>
        Veckopulsens uppgifter sparas så länge kontot finns eller tills du ber oss radera dem.
        För tillgång till eller borttagning av äldre veckopulssvar kan du kontakta oss på adressen
        ovan. Vid radering av hela kontot tas även veckopulsens uppgifter bort.
      </p>
      <h2>Var dina uppgifter lagras</h2>
      <p>
        Uppgifterna lagras hos vår molnleverantör inom EU (Supabase / AWS Europe). AI-svar genereras
        via Lovable AI Gateway och skickas då i förekommande fall till underleverantörer såsom
        Google (Gemini) – bland annat den text du skriver till Pace och material du laddar upp för
        tolkning (t.ex. schemabilder). Kartlänkar öppnas hos Google Maps först när du själv klickar.
        Inga uppgifter säljs vidare, och ditt innehåll används inte för att träna AI-modeller.
      </p>

      <h2>Hur länge vi sparar</h2>
      <p>
        Ditt konto och tillhörande innehåll sparas så länge du har ett aktivt konto. Du kan när som
        helst radera enskilda poster, enskilda Pace-samtal eller hela ditt konto med all data direkt
        i appen under Inställningar → Avsluta konto. Vid utloggning rensas dessutom den lokala
        kopian på enheten och den lokala krypteringsnyckeln raderas. Behöver du hjälp når du oss på{" "}
        <a href="mailto:kontakt@paceable.se">kontakt@paceable.se</a>.
      </p>

      <h2>Dina rättigheter enligt GDPR</h2>
      <ul>
        <li>Rätt till tillgång, rättelse och radering av dina uppgifter.</li>
        <li>Rätt att invända mot eller begränsa behandling.</li>
        <li>Rätt till dataportabilitet.</li>
        <li>Rätt att återkalla samtycke när som helst.</li>
        <li>Rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY).</li>
      </ul>

      <h2>Barns uppgifter</h2>
      <p>
        Du kan lägga in barns scheman och aktiviteter för att få ihop familjens vardag. Lägg bara in
        det som behövs, och undvik känsliga detaljer om andra personer. Du ansvarar för uppgifter om
        andra som du väljer att spara.
      </p>

      <h2>Cookies och lokal lagring</h2>
      <p>
        Paceable använder endast nödvändig lokal lagring i webbläsaren för att komma ihåg dig som
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
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-[#7C5CE0] font-semibold">
          ← Paceable
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

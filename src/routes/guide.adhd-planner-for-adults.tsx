import { createFileRoute, Link } from "@tanstack/react-router";

const URL = "https://myflove.lovable.app/guide/adhd-planner-for-adults";
const TITLE = "ADHD-planner för vuxna: så väljer du rätt (2026)";
const DESC =
  "Guide för vuxna med ADHD som söker en planner som faktiskt håller. Jämför digitala och analoga lösningar och se hur Paceable minskar mental belastning.";

export const Route = createFileRoute("/guide/adhd-planner-for-adults")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Paceable – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESC,
          author: { "@type": "Organization", name: "Paceable" },
          publisher: { "@type": "Organization", name: "Paceable" },
          mainEntityOfPage: URL,
          inLanguage: "sv-SE",
          datePublished: "2026-07-20",
        }),
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-[#7C5CE0] font-semibold">
          ← Paceable
        </Link>
        <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold leading-tight">
          ADHD-planner för vuxna: så väljer du en som faktiskt håller
        </h1>
        <p className="mt-2 text-sm text-[#6B647F]">
          En stödjande guide för vuxna och yrkesverksamma med ADHD.
        </p>

        <article className="mt-10 space-y-6 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-[#7C5CE0] [&_a]:underline">
          <p>
            De flesta planners är byggda för en hjärna som redan minns att öppna dem. En bra{" "}
            <strong>ADHD-planner för vuxna</strong> gör tvärtom — den möter dig där du är, sänker
            friktionen och tar bort mental belastning istället för att lägga på mer. Här går vi
            igenom vad du faktiskt ska titta efter, jämför digitalt mot papper, och visar hur
            Paceable är designad kring de vanligaste friktionspunkterna.
          </p>

          <h2>Vad gör en planner ADHD-vänlig?</h2>
          <ul>
            <li>
              <strong>Låg startfriktion.</strong> Om det tar mer än några sekunder att fånga en
              tanke, hamnar den ingenstans.
            </li>
            <li>
              <strong>Externt minne.</strong> Påminnelser, larm och återkommande rutiner som inte
              förutsätter att du kommer ihåg dem själv.
            </li>
            <li>
              <strong>Energimedvetenhet.</strong> Din kapacitet varierar över dagen — planen måste
              kunna följa med.
            </li>
            <li>
              <strong>Överskådlighet utan överväldigande.</strong> En vy, en nästa sak. Inte femton
              kalendrar staplade på varandra.
            </li>
            <li>
              <strong>Förlåtande design.</strong> Missade dagar ska inte kännas som ett misslyckande
              — de ska bara flyta vidare.
            </li>
          </ul>

          <h2>Digital eller papper?</h2>
          <h3>Papper</h3>
          <p>
            Papper är taktilt, distraktionsfritt och belönar den som älskar att skriva för hand.
            Nackdelen är att det inte påminner dig, inte följer med i fickan om du glömmer det på
            köksbordet, och inte kan omorganisera sig när dagen kraschar. Många vuxna med ADHD köper
            en vacker bullet journal — och slutar använda den efter tre veckor.
          </p>
          <h3>Digitalt</h3>
          <p>
            Digitala planners kan påminna, larma, återkomma och synka mellan enheter. Risken är att
            de blir för komplexa: fler flikar, fler listor, fler notiser. Det du vill ha är en app
            som gör mindre — men gör det åt dig.
          </p>
          <h3>Kort svar</h3>
          <p>
            Välj digitalt om du glömmer bort saker eller tappar bort papper. Välj papper om du får
            ångest av skärmar. Välj hybrid om du älskar båda: en enkel digital plan för påminnelser,
            en anteckningsbok för reflektion.
          </p>

          <h2>De fyra vanligaste friktionspunkterna (och hur Paceable löser dem)</h2>
          <ul>
            <li>
              <strong>Mental belastning:</strong> Rutiner™ i Paceable kör dina återkommande sekvenser
              åt dig — morgon, medicin, tvätt — så huvudet slipper hålla reda på ordningen.
            </li>
            <li>
              <strong>Överväldigande:</strong> Planering tar din lista och föreslår <em>en</em>{" "}
              nästa sak baserat på din energinivå just nu.
            </li>
            <li>
              <strong>Att fastna:</strong> Stoppknappen™ ger dig en 60-sekunders andningspaus och en
              mjuk AI-reflektion när något låst sig.
            </li>
            <li>
              <strong>Bortglömda saker:</strong> Proaktiva loopar påminner om paraply när det
              regnar, medicin om du inte kryssat i, tvätt som ligger kvar i maskinen.
            </li>
          </ul>

          <h2>Checklista innan du väljer</h2>
          <ul>
            <li>Kan jag lägga in en uppgift på under 5 sekunder?</li>
            <li>Får jag en påminnelse även när appen är stängd?</li>
            <li>Kan planen anpassa sig om jag har låg energi idag?</li>
            <li>Slipper jag skam när jag missar en dag?</li>
            <li>Kan jag använda den både på mobilen och på datorn?</li>
          </ul>

          <h2>Prova Paceable</h2>
          <p>
            Paceable är byggd av och för människor med neurodivergenta hjärnor. Ingen
            produktivitetshype, ingen shame-loop — bara ett varmt stöd i vardagen.{" "}
            <Link to="/sign-up">Skapa ett konto</Link> och testa i några dagar. Det är gratis att
            komma igång.
          </p>
        </article>

        <div className="mt-16 flex flex-wrap gap-4 text-sm">
          <Link to="/" className="text-[#7C5CE0] underline">
            Hem
          </Link>
          <Link to="/sign-up" className="text-[#7C5CE0] underline">
            Skapa konto
          </Link>
          <Link to="/integritet" className="text-[#7C5CE0] underline">
            Integritet
          </Link>
        </div>
      </div>
    </main>
  );
}

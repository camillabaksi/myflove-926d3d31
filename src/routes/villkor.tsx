import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./integritet";

export const Route = createFileRoute("/villkor")({
  head: () => ({
    meta: [
      { title: "Användarvillkor – Paceable" },
      {
        name: "description",
        content:
          "Villkor för att använda Paceable – ansvar, konto, innehåll och avslut. Skrivet enkelt och mänskligt.",
      },
      { property: "og:title", content: "Användarvillkor – Paceable" },
      {
        property: "og:description",
        content:
          "Villkor för att använda Paceable – ansvar, konto, innehåll och avslut. Enkelt och mänskligt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Användarvillkor – Paceable" },
      { property: "og:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Paceable – Bär mindre. Gör inte mer." },
      { name: "twitter:image", content: "https://myflove.lovable.app/og-image.jpg" },
      { property: "og:url", content: "https://myflove.lovable.app/villkor" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/villkor" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Användarvillkor" updated="28 augusti 2026">
      <p>
        Välkommen till Paceable. Genom att skapa konto och använda tjänsten godkänner du dessa
        villkor. Vi håller dem korta och begripliga.
      </p>

      <h2>Om tjänsten</h2>
      <p>
        Paceable är ett digitalt stöd för vardagen – Idag, kalender, uppgifter, rutiner, Mitt
        batteri, ekonomi, matlista, inköp, studier, jobb, reseinfo och AI-följeslagaren Pace.
        Tjänsten är ett hjälpmedel och ersätter inte medicinsk, juridisk eller ekonomisk rådgivning.
        Den är inte en medicinteknisk produkt och ska inte användas i akuta lägen – mår du dåligt,
        kontakta vården eller ring 112.
      </p>

      <h2>Ditt konto</h2>
      <ul>
        <li>Du måste vara minst 16 år för att skapa konto.</li>
        <li>Du ansvarar för att hålla ditt lösenord hemligt.</li>
        <li>Du får inte använda tjänsten för olagliga ändamål eller skada andra.</li>
      </ul>

      <h2>Ditt innehåll</h2>
      <p>
        Allt du skapar i Paceable tillhör dig. Vi gör inga anspråk på ditt innehåll och säljer det
        inte vidare. Vi behöver dock en teknisk licens att lagra och visa det för att tjänsten ska
        fungera. Laddar du upp material (t.ex. scheman) ansvarar du för att du har rätt att göra
        det.
      </p>

      <h2>AI-assistenten Pace</h2>
      <p>
        Pace är en AI-baserad följeslagare. Svaren kan innehålla fel och ska ses som förslag – inte
        fakta, diagnos eller behandling. Du är själv ansvarig för beslut du tar utifrån dem. Sparade
        samtal är din egen historik och kan raderas när som helst.
      </p>

      <h2>Påminnelser och notiser</h2>
      <p>
        Påminnelser (inklusive medicin) är ett stöd, inte en garanti. Leverans kan påverkas av din
        enhet, operativsystem, batterisparläge och nätverk – förlita dig inte enbart på appen för
        kritiska påminnelser.
      </p>

      <h2>Delning med andra</h2>
      <p>
        Väljer du att dela listor, kalender eller hushåll med andra kan de se och ändra det delade
        innehållet. Dela bara sådant du vill att de ska se.
      </p>

      <h2>Tillgänglighet</h2>
      <p>
        Vi strävar efter hög drifttid men kan inte garantera att tjänsten alltid är tillgänglig. Vi
        kan uppdatera, ändra eller pausa funktioner för att förbättra upplevelsen. Paceable utvecklas
        löpande och vissa delar kan finnas kvar i testversion.
      </p>

      <h2>Avsluta ditt konto</h2>
      <p>
        Du kan när som helst radera ditt konto och all data direkt i appen under Inställningar →
        Avsluta konto. Vi kan avsluta konton som bryter mot villkoren eller missbrukar tjänsten.
      </p>

      <h2>Ansvarsbegränsning</h2>
      <p>
        Paceable tillhandahålls "i befintligt skick". Vi ansvarar inte för indirekta skador eller
        förluster som uppstår genom användning av tjänsten, i den utsträckning gällande lag
        tillåter. Inget i dessa villkor begränsar dina rättigheter som konsument enligt tvingande
        lag.
      </p>

      <h2>Tillämplig lag</h2>
      <p>
        Svensk lag tillämpas. Tvister löses i första hand genom dialog, och därefter vid svensk
        allmän domstol. Som konsument kan du även vända dig till Allmänna reklamationsnämnden (ARN).
      </p>

      <h2>Kontakt</h2>
      <p>
        Frågor? Skriv till <a href="mailto:camillabaksi@hotmail.com">camillabaksi@hotmail.com</a>.
      </p>
    </LegalShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "./integritet";

export const Route = createFileRoute("/villkor")({
  head: () => ({
    meta: [
      { title: "Användarvillkor – MyFlove" },
      {
        name: "description",
        content:
          "Villkor för att använda MyFlove – ansvar, konto, innehåll och avslut. Skrivet enkelt och mänskligt.",
      },
      { property: "og:title", content: "Användarvillkor – MyFlove" },
      {
        property: "og:description",
        content:
          "Villkor för att använda MyFlove – ansvar, konto, innehåll och avslut. Enkelt och mänskligt.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://myflove.lovable.app/villkor" },
    ],
    links: [{ rel: "canonical", href: "https://myflove.lovable.app/villkor" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Användarvillkor" updated="18 juli 2026">
      <p>
        Välkommen till MyFlove. Genom att skapa konto och använda tjänsten godkänner
        du dessa villkor. Vi håller dem korta och begripliga.
      </p>

      <h2>Om tjänsten</h2>
      <p>
        MyFlove är ett digitalt stöd för vardagen – kalender, uppgifter, humör,
        ekonomi, matlista, reseinfo och en AI-assistent (Flow). Tjänsten är ett
        hjälpmedel och ersätter inte medicinsk, juridisk eller ekonomisk rådgivning.
      </p>

      <h2>Ditt konto</h2>
      <ul>
        <li>Du måste vara minst 16 år för att skapa konto.</li>
        <li>Du ansvarar för att hålla ditt lösenord hemligt.</li>
        <li>Du får inte använda tjänsten för olagliga ändamål eller skada andra.</li>
      </ul>

      <h2>Ditt innehåll</h2>
      <p>
        Allt du skapar i MyFlove tillhör dig. Vi gör inga anspråk på ditt innehåll och
        säljer det inte vidare. Vi behöver dock en teknisk licens att lagra och visa
        det för att tjänsten ska fungera.
      </p>

      <h2>AI-assistenten Flow</h2>
      <p>
        Flow är en AI-baserad följeslagare. Svaren kan innehålla fel och ska ses som
        förslag – inte fakta. Du är själv ansvarig för beslut du tar utifrån dem.
      </p>

      <h2>Tillgänglighet</h2>
      <p>
        Vi strävar efter hög drifttid men kan inte garantera att tjänsten alltid är
        tillgänglig. Vi kan uppdatera, ändra eller pausa funktioner för att förbättra
        upplevelsen.
      </p>

      <h2>Avsluta ditt konto</h2>
      <p>
        Du kan när som helst radera ditt konto och all data. Vi kan avsluta konton
        som bryter mot villkoren eller missbrukar tjänsten.
      </p>

      <h2>Ansvarsbegränsning</h2>
      <p>
        MyFlove tillhandahålls "i befintligt skick". Vi ansvarar inte för indirekta
        skador eller förluster som uppstår genom användning av tjänsten, i den
        utsträckning gällande lag tillåter.
      </p>

      <h2>Tillämplig lag</h2>
      <p>
        Svensk lag tillämpas. Tvister löses i första hand genom dialog, och därefter
        vid svensk allmän domstol.
      </p>

      <h2>Kontakt</h2>
      <p>
        Frågor? Skriv till <a href="mailto:camillabaksi@hotmail.com">camillabaksi@hotmail.com</a>.
      </p>
    </LegalShell>
  );
}

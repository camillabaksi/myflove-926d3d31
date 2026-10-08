# Paceable – samma godkända design på återstående sidor

## Mål och avgränsning

Fortsätt efter den publicerade första etappen: även **Äldre Hem och Flow** ska följa Paceables befintliga visuella identitet. Ingen ny designriktning eller ombyggnad. Planen måste godkännas före appkodändring; ingen publicering ingår.

Idag, Kalender, Tankar, Min plats och navigationen behåller sitt godkända utseende. Den publika webbplatsen och native-projektens ikoner ingår inte.

## Inventering

Gemensamma Paceable-färger, ytor, kanter, djup och typsnittsroller finns redan i båda teman. Första etappen har anslutit många sidor, men egna gradienter och äldre färgval finns kvar. Hem och Flow är fortfarande uttryckligen undantagna från den gemensamma stilen.

Före-bilder har tagits av Hem och den befintliga Flow-chatten. Hem har lila/rosa bakgrundsglöd och starkt violetta knappar. Flow har gradientrubrik, lavendelytor och violetta pratbubblor. Innehåll och funktioner ska behållas.

| Område / sida | Befintligt | Avgränsad justering | Återanvändning | Insats |
|---|---|---|---|---|
| Gemensamt utseende | Publicerade Paceable-ytor; Hem/Flow undantagna | Anslut även dessa sidor till samma färger, kanter och dialogdjup | Befintliga färgvärden och gemensamma byggstenar | Låg |
| Äldre Hem | Befintliga genvägar, Just nu, barnschema och utfällbara delar; färgstarka ytor | Tona ned dekorativa gradienter, anpassa kort och knappar; orienterande hälsning får befintlig rubrikstil | Samma innehåll och kort, ingen omflyttning | Medel |
| Flow och samtal | Historik, områdesval, pratbubblor, inmatning och maskot | Samma lugna ytor och knappstil; tydlig skillnad mellan egna och Flows meddelanden | Befintlig chatt och kontroller | Medel |
| Uppgifter, Träning, Studier, Arbete, Historik | Gemensamma kort plus egna dekorativa gradienter | Ersätt återstående dekorativa färgval med befintliga Paceable-ytor | Gemensamma kort och rubriker först | Medel |
| Familj, barn och inställningar | Formulär och områdesmarkeringar | Bara kvarvarande visuella avvikelser; bevara betydelsebärande områdesfärger | Befintliga formulär och dialoger | Låg–medel |
| Insikter, Energikarta, Friktionsindex och statistik | Diagram och egna färgval | Anpassa omgivande ytor och dekorativa färger, inte diagrammens betydelse eller data | Befintliga färgvärden där betydelsen stämmer | Medel |
| Flowplan och äldre FlowScore | Befintliga planerings- och informationsvyer | Anpassa ramar, ytor och funktionell typografi; inga nya poäng eller stenplaceringar | Befintliga byggstenar | Låg–medel |

## Genomförande – minsta ändring först

1. Utvidga den befintliga Paceable-avgränsningen till Hem och Flow, inklusive samtalens undersidor och tillhörande dialoger. Kontrollera resultatet innan fler regler tillkommer.
2. Rätta bara kvarvarande dekorativa avvikelser genom befintliga gemensamma kort, rubriker och färgvärden. Undvik breda regler som färgar om alla gradienter eller statusmarkeringar.
3. Gör små lokala justeringar där egna kort eller pratbubblor fortfarande avviker. Behåll ordning, antal delar, klickytor, chattens rullning och sidornas layout.

Fraunces används uttryckligen och sparsamt för orienterande rubriker; Inter för funktioner, formulär, aktiviteter, status, meddelanden och metadata. Återanvänd redan godkända radier och djup.

## Skydd

- Ingen ändring av funktioner, sparning, konto, auth, synkning, databas, notiser eller tekniska identifierare.
- Kalendergeometri, Capacity/Load/Pace, familjebehörigheter och barnens read-only-visning lämnas orörda.
- Flow-maskoten och godkända scenbilder bevaras; inga nya bilder, stenformationer eller stenplaceringar.
- Godkända logotyper, ikoner och stenar ändras inte. Inga nya paket.
- Betydelsebärande områdes-, status- och diagramfärger ersätts inte med dekorativ plommonfärg.

## Verifiering och leverans

- Kontrollera representativa återstående sidor samt Hem och Flow vid 360/390/430/1024/1440 px, ljust/mörkt och 200 % text.
- Kontrollera WCAG AA-kontrast, synligt tangentbordsfokus, dialoger och mobilens klickytor.
- Kontrollera chatthistorik, rullning, inmatning och öppning av befintliga funktioner utan att skriva testinnehåll i användarens konto.
- Jämför Idag, Kalender, Tankar och Min plats med före-bilder; deras utseende ska inte förändras.
- Kör hela befintliga testsviten och kontrollera automatiskt bygge. Redovisa ändrade filer, före/efter-bilder och eventuella begränsningar.
- Uppdatera båda ändringsloggarna vid genomförandet. Invänta separat godkännande för publicering.

## Tekniskt

Utgå från `src/components/layout.tsx`, `src/styles.css` och befintliga `src/components/myflove/`-byggstenar. Hem finns i `src/pages/home.tsx`; Flow omfattar även befintliga komponenter under `src/components/flow/` och `/assistant`-undersidor. Använd avgränsade regler och opt-in-presentation, inte globala rubrikändringar eller nya parallella komponentfamiljer. Det exakta antalet filer beror på vilka lokala färgval som kvarstår efter gemensam anslutning.

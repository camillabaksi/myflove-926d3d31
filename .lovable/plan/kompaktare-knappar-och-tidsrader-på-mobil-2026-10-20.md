# Kompaktare knappar och tidsrader på mobil

## Mål
Göra appen mer överskådlig på mobil med mindre synliga knappar, tätare tidsval och en kortare tidslinje i kalendern. Datorns layout behålls.

## Ändringar
1. **Knappar:** minska synlig knapphöjd, sidluft och avstånd i appens befintliga kompakta sidlayouter. Behåll minst 44 × 44 px separata tryckytor, läsbar text och tydlig fokusmarkering. Ingen generell krympning av alla knappar, navigering eller skyddade specialvyer.
2. **Tidsval:** gör val av klockslag, längd och föreslagna tider kompaktare i Kalender, Planera och pausflödet. Samma val, handinmatning och sparning som idag. Anpassa även val som öppnas i dialoger.
3. **Kalenderns tidsrader:** minska mobilens tidslinje med cirka 20 %, så fler timmar ryms. Behåll minst 44 px för klickbara aktiviteter och fullständiga tider. Täta korta aktiviteter hanteras utan överlappande tryckytor. Dagsvyn använder idag en lista; där minskas luft mellan rader, inte aktiviteternas tider.
4. **Stor text:** behåll textförstoring och låt kontroller växa eller brytas kontrollerat. Undvik trängsel, kapade namn och sidledes scrollning av hela sidan.

## Skydd
- Inga ändringar av aktiviteter, avbockning, batteri, Pace, familjedelning, privata uppgifter, utkast, lagring eller synk.
- Samma datum, klockslag, ordning och betydelse. Inga nya paket, nativeändringar eller publicering.
- Mer och Pace behåller sina godkända speciallayouter; anteckningsbokens papper och skrivytor berörs inte.

## Teknisk avgränsning
- Återanvänd befintliga opt-in-klasser för kompakta kontroller och sidlayouter; avgränsa nya regler till mobil, under 768 px. Behåll delade Button-standarder.
- Kalenderns nuvarande skala är 1,7 px/minut. Samla tidsgeometrin och använd cirka 1,35 px/minut på mobil, med oförändrad desktopskala. Synkronisera aktiviteternas placering, tidslinjehöjd, timlinjer, luckor, NU-markering, drag-and-drop och slutet av dygnet. Justera visuell överlappshantering till den nya skalan utan att anta aktivitetslängder.
- Relevanta filer är kalenderkomponenten, kalenderns presentationshjälpare, planerings-/pauskomponenterna och avgränsade regler i befintlig CSS. Exakta ändringar görs efter genomläsning; ingen CSS-transform av tidslinjen.

## Kontroll och leverans
- Före-/efterbilder vid 360, 390 och 430 px; kontroll vid 768, 1280 och 1600 px att datorlayouten bevaras.
- Ljust/mörkt tema och normal/200 % text; kontroll av tryckytor, tangentbordsfokus, intern kalender-scroll och vanlig sidskroll.
- Riktade tester för tidsplacering, korta aktiviteter, drag-and-drop, NU-markering, sen kväll och befintliga tidsval. Kontrollera verkliga osparade mobilflöden utan testskrivningar i ditt konto.
- Uppdatera båda ändringsloggarna och redovisa bilder samt eventuella begränsningar. Fysisk telefon och verkliga spar-/flyttflöden kräver separat säker testmiljö.

**Appen är ännu inte ändrad. Genomförandet börjar efter ditt godkännande av planen.**
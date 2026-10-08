# Kompakt kapacitetsstöd i mobilkalendern

## Resultat
Endast mobilens befintliga ”Vad påverkar din kapacitet?” får en kompakt presentation. Kalendern kommer tidigare när stödet är stängt. Ingen publicering.

## Stängt och utfällt läge
- Stängt som standard när kalendern öppnas, utan att automatiskt stänga en pågående registrering.
- Hela raden öppnar/stänger: befintlig ikon, rubriken, ”Lägg till vid behov” och tydlig ned-/uppåtpil.
- Befintliga rosa/aprikosa ytor, rundning, diskret kant och subtil skugga. Ingen ny dekor eller illustration.
- Utfällt visas exakt dagens formulär direkt under rubriken, inklusive befintliga förklaringar. Referensbildens exempelalternativ införs inte.
- Osparade val bevaras när raden stängs och öppnas; ingen ny lagring införs. Samma validering och sparfunktion används.

## Placering och skydd
- Samma placering i månad, vecka och dag; Veckans mål flyttas inte.
- Desktopplacering, kontrollrader och Etapp 2A:s textförstoring bevaras. Andra sidor och den delade expanderbara komponentens standardbeteende lämnas oförändrade.
- Capacity/Load/Pace, familj, kalendergeometri, tidsblock, drag/drop, undo, aktiviteter, data, synk, kryptering, notiser, navigation, identifierare och stenar ändras inte.

## Tillgänglighet
- Befintlig knappkomponent med minst 44 px klickhöjd, synligt fokus samt öppet/stängt tillstånd och koppling till innehållet för skärmläsare.
- Naturlig radbrytning och innehållsanpassad höjd vid 200 %; ingen textminskning, kapning eller horisontell sidscroll.
- Stängt formulär är inte åtkomligt via tangentbord, men dess osparade val bevaras.

## Tekniskt genomförande
- Lägg till uttryckligt opt-in-läge för mobilkalendern i `src/components/impact-checkin.tsx`; samma formulär återanvänds och andra anrop behåller dagens presentation.
- Aktivera läget där Kalender skapar sitt befintliga check-in-innehåll. Återanvänd befintlig mobil/desktopgräns, inte textstorleken, för att avgränsa presentationen.
- Undvik ändringar i `ExpandableBlock`, collapse-lagring och den befintliga desktoplösningen. Bevara en formulärinstans och dess pågående val vid öppning/stängning och kontrollera byte mellan kalendervyer.
- Använd befintliga tokens och endast lokalt avgränsade stilar vid behov. Inga paket, serverändringar eller migreringar.
- Uppdatera riktade tester, AGENTS.md, roadmap, CHANGELOG.md och `src/lib/changelog.ts`.

## Verifiering och leverans
- Ta före/efter-bilder med samma konto och innehåll.
- Månad, vecka och dag vid 360/390/430 px med normal och 200 % text: kompakt rad, komplett formulär, bibehållna osparade val, fokus/tangentbord och ingen sidscroll.
- Kontrollera sparfunktionen med isolerad testdata eller kontrollerad testdubbel, inte genom att skriva över användarens registrering; redovisa om verklig kontosparning inte har testats.
- Jämför desktop vid 1024/1440 px, även textförstoring, och kontrollera att Veckans mål och övriga kontroller är oförändrade.
- Kör befintliga tester och kontrollera arbetsmiljöns automatiska bygg-/typkontrollsignal; redovisa eventuella begränsningar.
- Visa mobil månad stängd/öppen, mobil vecka/dag samt desktopkontroll. Rapportera ändrade filer och resultat. Publicera inte.
# Etapp 2A – riktad tillgänglighetsrättning

## Avgränsning
Behåll den godkända layouten vid normal textstorlek. Anpassa endast Idag och Kalender när förstorad text kräver mer utrymme. Ingen redesign eller publicering.

## Idag
- Låt hela hälsningen radbrytas naturligt med oförändrad Fraunces-storlek.
- Placera originalstenarna på separat rad när de inte ryms bredvid texten. Normal placering och bildfil bevaras.
- Låt Capacity-värdet och batterispåret få separata rader vid platsbrist, så batteriet inte pressas ihop.

## Kalender
- Anpassa rubrik, periodnavigation, Capacity och Veckans mål för läsbara radbrytningar utan mindre text.
- Gruppera befintliga kontroller effektivare vid förstoring: rubrik/vy/period, familj/visningsval, dagens Capacity. Flytta sekundära desktopverktyg efter huvudkalendern endast i det anpassade läget; normallayouten lämnas oförändrad.
- Behåll en enda instans av varje kontroll och formulär, samma funktioner och tangentbordsåtkomst.
- Gör aktivitetsnamn fullt läsbara där radbrytning ryms utan att ändra tidsblock, dagbredder eller dragytor.

## Viktig skyddsgräns
Långa namn kan vara omöjliga att visa i sin helhet inuti ett kort, geometriskt låst tidsblock vid 200 % text. Om detta bekräftas stoppas just den delrättningen och målkonflikten rapporteras för beslut. Ingen utvidgning av tidsblock, överlappande text, dold ellips eller ny kalenderfunktion införs för att kringgå skyddet. Befintlig detaljvisning bevaras, men räknas inte som att hela namnet blivit synligt i tidsblocket.

## Skydd
Ingen ändring av Capacity/Load/Pace, kalendergeometri, NU-linje, familjebehörigheter, barnschemats read-only-visning, data, sparning, påminnelser, navigation, lagring eller stenasset. Ingen generell CSS-förändring på andra sidor.

## Tekniskt genomförande
- Sidavgränsad anpassning till faktiskt textutrymme, inte enbart skärmbredd; samma skalningsmetod som i QA används för verifiering.
- Berörda huvudfiler: `src/pages/today.tsx`, `src/components/calendar/calendar-planner.tsx`, `src/styles.css`.
- Vid behov opt-in-presentation i `src/components/day/today-capacity.tsx`, `src/components/calendar/capacity-battery.tsx` och `src/components/week-goals.tsx`; andra användningar lämnas oförändrade.
- Dokumentera i AGENTS.md, roadmap och båda changelogfilerna. Inga nya paket eller serverändringar.

## Verifiering och leverans
- Idag samt månad/vecka/dag: 360, 390, 430, 768, 1024, 1280 och 1440 px vid normal och 200 % text.
- Jämför normallayout före/efter med stabilt innehåll; kontrollera stenar, ordning, batterier, fokus, tangentbord och texters verkliga utrymme.
- Kör befintlig testsvit och läs automatisk bygg-/typkontrollsignal; redovisa om separat typkontroll inte är tillgänglig.
- Rapportera ändrade filer, bekräftade rättningar och kvarvarande begränsningar; visa nya bilder. Ingen publicering.

Veckans framtida desktopgeometri och förklaringar av månadens prickar/procent är separata frågor och ingår inte.
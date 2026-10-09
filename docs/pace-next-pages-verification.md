# Kalender, Fånga och Min plats – 2026-10-09

## Ändringar
- `calendar-planner.tsx`: uttryckligt markerade huvudkontroller och filter, lokal rubrikfärg; periodpilar och tidsgeometri bevarade.
- `calendar.tsx`: lokal klass runt befintliga dagens verktyg.
- `dump.tsx`, `health.tsx`: lokal sidavgränsning, rubrik och ingångar.
- `quickflow-capture.tsx`: opt-in klass; mindre inre marginal endast på Fånga.
- `quickflow-image-import.tsx`: valfri appearance för importingångar; inga ändrade filval eller dialoghandlingar.
- `styles.css`: lokala semantiska plommonroller och mindre visuella ytor inom faktiska 44px kontrollboxar. Ingen global palettändring.
- Presentationstest, arkitekturregel, roadmap och båda ändringsloggarna.

## Kontroller
- Befintlig full testsvit: 545/545 godkända i 87 filer före det nya skyddstestet.
- Playwright: 48 kontroller över Kalender/Fånga/Min plats, 360/390/430/1280px, båda teman och 100/200% rottextstorlek. Inget dokumentöverflöde, inga för små markerade kontrollboxar efter avslutade sidanimationer, inga pageerror-händelser.
- Kalender: Månad/Vecka/Dag, period fram/bak, Privat av/på och återställt, Familj-dialog och Lägg till-dialog öppnades/stängdes.
- Fånga: befintlig textdialog med osparad text, Bild-dialog och PDF/dokument-filväljare öppnades utan import eller sparning.
- Min plats: samma tre huvudlänkar och expansion Mer inom hälsa verifierade.
- Automatisk bygglogg: build OK.

## Bildgranskning
Före-/efterbilder granskades i båda teman på 390px. Efterbilder och dialogbilder finns i testmiljön under `/tmp/browser/pace-next/`. Testmiljön byttes under körningen och första omgångens temporära före-bilder försvann; visade före-bilder finns kvar i samtalet.

Vid 200% text får Fångas huvudrubrik många rader på smala mobiler, särskilt med den låsta stenplaceringen. Den klipps inte och överlappar inte, men tar stor höjd. Inga stenassets eller placeringar ändrades för att komprimera den.

## Begränsningar och skydd
Ingen faktisk mikrofoninspelning, dokumentanalys, sparning, extern kalendersynk, fysisk telefon eller verklig skärmläsare testades. Inga testposter sparades. Idag/Mer, basknappen, data/auth, familjbehörigheter, Capacity/Pace, native-projekt och originalbilder ändrades inte. Ingen publicering.
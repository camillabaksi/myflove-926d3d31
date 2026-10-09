# Idag – Etapp 1: logotyp och sidhuvud

Datum: 2026-10-09. Endast godkänd Etapp 1 genomförd; ingen publicering.

## Presentation
- Mobilens befintliga `BrandLogo` i Layout återanvänds, vänsterställd och 220 CSS-px bred med maxbredd och originalproportioner. Ingen extra logotyp införs. Desktop behåller sin befintliga logotyp i sidomenyn.
- Idags Fraunces-hälsning använder 2rem (32 px normalt, 64 px vid 200 % text). Namnlogik, datum och namnmeny är oförändrade; menyn ligger nu i vanligt tvåkolumnsflöde med 44 × 44 px tryckyta.
- Endast Idags dekorativa `PaceableStones`-anrop och import borttagna. Alla originalassets och andra stenplaceringar lämnas orörda.
- Knappar, personval, kapacitetskort, aktiviteter, datalogik, behörigheter, navigation, notiser, lagring, native och beroenden oförändrade.

## Filer
Presentation: `src/components/layout.tsx`, `src/pages/today.tsx`, `src/styles.css`.

Tester: `src/pages/today-header.test.tsx` (tre statiska skyddsgränstester; visuell kontroll görs separat i webbläsaren).

Dokumentation: `AGENTS.md`, `roadmap.md`, `CHANGELOG.md`, `src/lib/changelog.ts`, denna rapport. Kraven för Idag uppdaterade i projektminnet.

## Verifiering
- Hela sviten: `bunx vitest run --maxWorkers=1`: **545/545 tester i 87 filer**, slutlig full körning godkänd. En tidigare körning hade ett befintligt timingkänsligt secure-local-testfel; separat omkörning av lagring/logotyp/namn/hälsning gav 22/22, därefter passerade hela sviten.
- Automatiskt förhandsvisningsbygge: build OK; ingen manuell bygg-/typkontroll körd.
- Playwright: 320, 360, 390, 430, 768, 1024, 1280 och 1440 px × ljust/mörkt × 100/200 % text = **32 kontroller**.
- En synlig logotyp per bredd, inget dokument-/innehållsöverflöde i sidled, ingen hälsning-/menyöverlappning. Logotypens originalkällor och Fraunces kontrollerade.
- Ett syntetiskt långt namn testades endast i renderad text vid 360 px/200 % utan kontosparning: hela namnet radbryts, inget horisontellt överflöde. Mycket långt namn med förstorad text kräver naturligt mer vertikal rullning.
- Namnmenyn öppnar befintlig dialog; Avbryt stänger och återför fokus. Inget namn eller annan kontodata sparades.
- Kalenderns befintliga mobil-logotyp kvar i 128 px med oförändrad centreringsklass.
- Inga fångade sidfel. Fysisk iOS/Android och verklig skärmläsare ej testade.

## Bilder
Före/efter vid 390 px i båda teman, desktop samt långt namn vid 200 % har visats i samtalet. Originalskärmbilder och mätresultat finns under `/tmp/browser/today-header/`.

Etapp 2 (knappar/filter) och Etapp 3 (personval) är inte genomförda och inväntar nytt uttryckligt godkännande.
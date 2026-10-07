# Paceable etapp 1D — tre detaljer före designlåsning

## Avgränsning
Behåll hela Etapp 1C:s godkända färgriktning och struktur. Ändra endast Min plats-symbolen i navigationen, presentationen av Idags aktivitetsrader och svensk datumtypografi. Ingen publicering. Ingen ändring av Core, data, funktioner, routes, lagring eller tekniska identifierare.

## 1. Min plats-symbolen
- Ersätt parentesliknande kurvor med en enda tunn, mjuk, lätt asymmetrisk öppen pebble/nest-kontur med en liten öppning snett upptill.
- Mycket tomrum, inga händer, fingrar, mittsymboler eller omgivande cirkel. Behåll labeln och ikonfamiljens stroke-vikt.
- Bedöm i faktisk 24 px-navigation, både aktiv och inaktiv; ändra inte Min plats-sidan.

## 2. Aktivitetsrader endast på Idag
- Ta bort tydlig skugga och färgad vänsterkant; använd diskret separator eller subtil yta.
- Minska dekorativ kategoriikon och kategori-chip till en liten färgad orienteringssignal med läsbar områdesetikett. Gör titel primär och metadata sekundär.
- Minska onödig höjd utan att krympa checkboxens och trepunktsmenyns tryckytor; sikta på minst 44 px för dessa kontroller.
- Klara aktiviteter behåller checkmark och befintlig genomstrykning med lugnare visuell vikt, utan celebration eller statusgrönt.
- Samma ordning, tider, kategorier, rutiner, återhämtning, Behöver mig, familjeägarskap, completion och samtliga meny-/sparfunktioner.

## 3. Svensk datumtypografi
- Ta bort ordvis kapitalisering på Idag. Visa ”Onsdag 7 oktober” genom svensk presentationsformatering som endast höjer datumsträngens första bokstav; ingen global lowercase.
- Andra språk behåller sin locale-formatering. Underliggande datum och locale-data lämnas orörda.
- Kontrollera motsvarande presentation på primärytorna. Kalendern använder också ordvis kapitalisering; eftersom kalenderändringar uttryckligen är förbjudna i denna etapp rapporteras den observationen separat och lämnas orörd.

## Tekniska detaljer
- Den delade aktivitetslistan används även på Hem och Kalender. Avgränsa den lättare presentationen med ett uttryckligt presentationsval från Idag, utan nya datakällor eller ändrade handlers.
- Berörda appfiler: `navigation-icons.tsx`, `today.tsx`, `daily-flow-list.tsx` och vid behov en liten datum-presentationshjälpare med tester. Inga globala tokenändringar.
- Uppdatera AGENTS.md, CHANGELOG.md och appens changelog; dokumentera presentationsgränsen och verifieringsresultaten.

## Verifiering och leverans
- Kör hela befintliga testsviten. Separat typkontroll och plattformens automatiska bygge verifieras via tillgängliga kontrollresultat, utan manuellt projektbygge/typecheck.
- Kontrollera Idag i 360/390 px och desktop: långa titlar, med/utan tid, flera kategorier, klar/oklar, checkbox, meny, minst 44 px tryckytor, fokus, textskalning, light/dark och inget horisontellt överflöde.
- Använd samma granskningskonto. Om verkliga data saknar en efterfrågad variant, testa den lokalt utan att skriva till kontots data och märk bilden tydligt som testinnehåll.
- Leverera kort slutrapport och tre 390 px-bilder: Idag överst, flera aktivitetsrader inklusive klar/oklar och bottom navigation med Min plats aktiv. Inga appändringar efter bilderna och ingen publicering.
- Fysiska iOS/Android-enheter ingår inte i sandboxkontrollen. Etapp 1 betraktas som låst först efter godkänd verifiering och din visuella granskning.

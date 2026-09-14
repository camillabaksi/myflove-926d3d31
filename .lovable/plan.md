# Förenkla Idag till ett utvecklat dagkort

## Resultat
Idag blir en enda kompakt dagsvy som följer veckoplaneringens visuella idé: datumrubrik, två små lägg-till-val och en sammanhängande lista över dagens innehåll. Tidsatta och otidsatta aktiviteter, rutiner och kalenderposter visas tillsammans; klara saker ligger kvar dämpade i samma lista.

## Genomförande
- Ersätt Flow/Lista-växlingen, de stora delsektionerna och timtidslinjen på `/idag` med ett luftigt dagkort och en gemensam aktivitetslista.
- Återanvänd `useFlowItems` som enda samlade källa för uppgifter, påminnelser, rutiner, barnposter, lektioner och QuickFlow. Behåll befintlig dubblettkontroll och cloud sync.
- Sortera tidsatta rader kronologiskt först och behåll befintlig naturlig prioriteringsordning för rader utan tid.
- Visa liten typmarkering per rad, tid endast när den finns, diskret klarmarkering samt befintliga åtgärder för redigering, radering och öppning.
- Behåll `+ Lägg till` och `+ Påminnelse` kompakt över listan. Flytta energi, omplanering och övrig fördjupning bakom en enda diskret öppning under dagkortet, utan att duplicera aktiviteter.
- Anpassa Kalenderns utvecklade Dag-läge till samma kompakta listprincip och ta bort dess dubbla Allt-i-dagen/tidslinje/kalendersektioner, medan vecka och månad lämnas fungerande.
- Ta bort imports och visningskod som blir oanvända, men behåll delade komponenter som används på andra platser.

## Teknisk kontroll
- Kontrollera unika rader för samma titel och tid samt att genomförandestatus och åtgärder fortfarande använder befintliga modeller.
- Kör typkontroll, tester och bygge.
- Kontrollera 360, 375, 390, 430 och 1280 px utan horisontell overflow eller döda knappar.
- Uppdatera ändringsloggar och roadmap med dagens datum.

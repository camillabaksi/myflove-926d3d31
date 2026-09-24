# Tydligare visuell Dagsvy

## Resultat
Den befintliga Dagsvyn blir en lugn, mobilanpassad överblick där tid, pictogram, aktivitet, område och klarstatus går att läsa direkt. Samma förbättrade rad används även i Kalenderns dagläge, utan nya aktivitetsmodeller eller ändrad synkning.

## Genomförande
- Återanvänd Family Flows kommersiellt tillåtna Lucide-pictogram och dess befintliga titelmatchning; lägg till en neutral standardikon när ingen aktivitet matchar.
- Visa varje aktivitet som en kompakt rad med tid, pictogram, titel och konsekvent områdesetikett. Barn visas som underkategori till Familj.
- Återanvänd befintliga livsområdesfärger för vänstermarkering, pictogrambakgrund och chip; ingen status uttrycks enbart med färg.
- Dela listan visuellt i återstående aktiviteter och den lugnare sammanfattningen “Klart idag”, men behåll samma data, sortering, dubblettskydd och klarlogik.
- Behåll flytta upp/ned, redigera, ta bort och öppna. På smala skärmar samlas sekundära åtgärder i en meny, medan klar-markering förblir direkt åtkomlig.
- Behåll befintliga Lägg till-, Påminnelse-, kalender-, QuickFlow- och fördjupningsflöden oförändrade.
- Uppdatera ändringsloggar med dagens datum.

## Kontroll
- Verifiera Idag och Kalenderns dagläge vid 360, 375, 390, 430 och 1280 px utan överlapp eller horisontell overflow.
- Kontrollera att klar-markering, återställning, ordningsflytt, redigering, borttagning och öppning fortfarande fungerar.
- Kontrollera att samma aktivitet inte visas dubbelt och att kalenderposter ligger kvar på rätt dag.
- Kör relevanta tester, typkontroll och produktionsbygge.

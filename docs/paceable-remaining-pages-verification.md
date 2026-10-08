# Paceable på återstående sidor — 2026-10-08

## Genomförande
- Befintlig Paceable-avgränsning utökad till äldre Hem och Flow med samtalsundersidor och dialoger.
- Befintliga neutrala block återanvänder kortytan, men explicit områdesfärg undantas.
- Dekorativa rubrikgradienter på Uppgifter och Insight ersatta med befintlig rubrikyta. Orienterande huvudrubriker på Hem, Historik, Familj, Träning, Studier, veckosammanfattning, Feedback och Dagens balans använder den uttryckliga editorialrollen. Funktionell text använder Inter.
- Flow-svar får befintlig upphöjd yta och tunn kant; meddelanden, inmatning, historik och rullning orörda. Desktopens chatts kolumn har minmax(0,1fr) för att inte växa med långt innehåll.
- Saknade sociala metadata kompletterade i 28 befintliga innehållsrutter med deras egna befintliga titlar/beskrivningar. Inga nya länkar eller bilder.
- Inga ändringar av datakällor, auth, sparning, synk, notiser, native-projekt, scenbilder, logotyper eller stenar.

## Kontroller
- 180 kombinationer: Hem, Flow, Uppgifter, Studier (befintlig redirect till StudyFlow), Jobb samt de fyra skyddade primärvyerna × fem bredder × två teman × normal/200 % text.
- Bredder: 360, 390, 430, 1024, 1440 px. Ingen dokumentöverbredd eller pageerror. Detta är inte ett påstående att varje befintligt tidsblock eller statusfärg är fullständigt WCAG-granskat.
- Nya neutrala text/ytpar: minst 5,18:1 ljust, minst 7,31:1 mörkt. Primära knappar: 12,48:1 respektive 14,70:1.
- Befintlig måendedialog öppnas i båda teman, fokus hamnar inne i dialogen och Escape stänger. Fokus återgår inte till öppnarknappen: ett befintligt funktionellt fel i Hem-dialogen som inte rättats i denna visuella etapp.
- Chatten visar befintlig historik, rullar över hela dess 2533 px-rullområde och visar inmatningen. Inget testinnehåll skickades eller sparades.
- Idag, Tankar och Min plats pixelidentiska när nya CSS-regler temporärt tas bort i webbläsaren. Kalenderns enda skillnad låg inom 4×8 px, förenligt med dynamisk markering; inte fullständigt pixelidentisk. Alla fyra har fortsatt ingen paceableApp-avgränsning.
- Hela sviten slutligen 516/516 i 81 filer. Det befintliga secure-local-testet föll med timing i två mellanliggande körningar, men klarade separat omkörning och sista fulla körningen. Ingen lagringskod eller test ändrades.

## Begränsningar
- Fullständig testning av alla sidor och betydelsebärande status-/diagramfärger ingår inte i den representativa kontrollen.
- Ingen sparande end-to-end-testning eller fysisk mobiltestning genomförd.
- Befintlig Hem-dialogs fokusåtergång kräver separat rättning/godkännande.
- Ingen publicering beställd.

Skärmbilder och tillfälliga kontroller finns under /tmp/browser/paceable-rest i arbetsmiljön.
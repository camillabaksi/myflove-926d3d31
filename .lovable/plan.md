# Tydligare MyFlove: ÖPPNA → NU → GÖR → KLAR → NÄSTA

Utgår från testarens feedback (ADHD + autism): hon förstod inte batteriet, det fanns för mycket på skärmen och hon visste inte vad hon skulle göra när appen öppnades. Ingen funktion eller data tas bort. Utseendet är detsamma, men det blir mindre att ta in på en gång.

## 1. Hem börjar med "Just nu"
- Direkt under hälsningen visas ett stort kort med **en enda sak att göra nu**. Den hämtas från dagens befintliga lista med kalender, uppgifter och rutiner. Om det bara finns saker med tid väljs den som ligger närmast i tid, annars den första som inte är klar.
- En stor **Klar**-knapp och en liten "Inte nu". När du trycker Klar kommer nästa sak fram direkt och det står "Bra jobbat – nästa:". Energifrågan efteråt fungerar som idag och sparas bara en gång.
- Är dagen tom visas "Inget planerat just nu" och en knapp för att lägga till något.

## 2. Dagens checklista på Hem
- Under Just nu visas **Dagens checklista**. Det är samma lista som i Min dag, med möten, sysslor och rutiner tillsammans och tider bara där de finns.
- Klara saker blir nedtonade och överstrukna. Menyn "…" finns kvar.

## 3. Batteriet blir begripligt
- På Hem står orken i ord: **Låg / Lagom / God ork**, en kort mening om vad det betyder för dagen och en liten stapel. Siffran i procent visas bara om man trycker på "Hur räknas det?".
- "Hur räknas det?" förklarar med tre enkla rader: vad du loggat om hur du mår, vad du har gjort idag och hur mycket du har kvar på dagen. Beräkningen i sig ändras inte.

## 4. Färre saker på skärmen
- De fyra rutorna (Kalender, QuickFlow, Batteri, Mående) läggs ihop till en rad med små genvägar under checklistan.
- "Din dag – fördjupa", Rutiner & medicin, områdesväljaren, installationskortet och genvägarna samlas i den hopfällda delen "Mer i MyFlove".
- Enkelt läge visar bara Just nu, checklistan och ordet för orken.
- Flow-maskoten står stilla om du har valt Ingen rörelse.

## 5. Nya användare
- Första gången visas bara Just nu och checklistan tillsammans med en kort mening: "Börja här – en sak i taget." Introduktionen går att hoppa över med ett tryck.

## Ändras inte
Data, synkning, inloggning, adresser i appen, Family Flow, kalenderkopplingen, hur batteriet räknas, Återhämtning och bottenmenyn.

## Tekniska detaljer
- Ny `src/components/home/now-card.tsx` som använder `useFlowItems().today` och `toggleItem`, samma sortering som `DailyFlowList` och `ACTIVITY_DONE_EVENT`.
- `DailyFlowList` återanvänds på Hem.
- Ny `src/components/home/ork-summary.tsx` som mappar `reading.now` via befintliga `ork`-nivåer.
- Omstrukturering av `src/pages/home.tsx` med `data-npf="optional"` på sekundära block. `flow-alive` stängs av när `npf.stillness` är på.
- Kontroll på 360/375/390/430 px och desktop, typkontroll, tester och bygge. CHANGELOG.md och src/lib/changelog.ts uppdateras.

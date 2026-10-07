# Paceable etapp 1 — visuell polish efter referensbilden

Bilden används som riktning för stilen, inte som mall. Kapacitetsringen och rött/grönt för energi tas inte med. Den horisontella kapacitetsvisningen ligger kvar. Ingen logik, data, sökvägar eller lagring ändras, och inget publiceras.

## 1. Ikonen för Min plats
- Den nuvarande ikonen med tre staplade vågor ersätts av två spegelvända, öppna kurvor som formar omslutande händer. Tunn linje och mycket tom yta, inga fingrar och ingen cirkel runt. Linjetjockleken blir densamma som för övriga ikoner.
- Ikonerna för Idag, Tankar och Mer justeras så att alla har samma linjetjocklek och storlek som i bilden.

## 2. Idag: ta bort den dubbla menyn
- Raden med Idag · Kalender · Lägg till högst upp på dagssidan tas bort.
- "+ Lägg till" blir en lugn knapp vid rubriken Din dag. Den öppnar samma Lägg till-sida som i dag.

## 3. Idag: mindre som en instrumentpanel
- Samma ordning: hälsning/datum, kapacitet, Din dag, Pace, stöd.
- Din dag blir sidans huvudinnehåll: ingen yttre ram, bara rubrik, mer luft och raderna direkt på sidan.
- Kort inuti kort tas bort. Pace och stöd blir lättare ytor med mer avstånd emellan.
- Avbockning, familjeval, påminnelser och Lägg till fungerar som förut.

## 4. Kalender: lugnare kontroller
- Valet för Familj och "Visa i kalendern" blir en enda diskret rad.
- Kalenderkoppling och Dagens verktyg blir små textknappar under kalendern, inte stora knappar ovanför den.
- Kalenderns funktioner, filter och familjedelning ändras inte.

## 5. Flow-texter på Idag, Kalender, Tankar och Min plats
- "Frivilligt – det hjälper Flow att anpassa dagen." blir "Frivilligt – hjälper Paceable att förstå vad som påverkar din dag."
- Min plats: "Prata med Flow" och dess förklaring får neutral text, till exempel "Prata om din dag". Länken leder till samma ställe.
- Andra synliga MyFlove/Flow-texter på de fyra sidorna listas i slutrapporten. Inget byts automatiskt utöver dessa två.

## 6. Färgbalans (ungefär 80 % lugnt, 20 % färg)
- Små accenter i salvia, aprikos, solgult och himmelsblått: ikonbakgrunder på Min plats-raderna, ett diskret tecken på Pace-ytan och en sol i hälsningen.
- Färgerna anger aldrig bra eller dåligt och ger ingen ny betydelse att lära sig.

## 7. Paceable-stenarna
- Samma tre stenformer används på högst två ställen: liten bredvid hälsningen på Idag och liten i Min plats-rubriken.
- Inga stora bilder. Stenarna tas bort där de inte tillför något.
- Rörelsen stängs av när enheten är inställd på minskad rörelse.

## Tekniska detaljer
- Ändras: `navigation-icons.tsx`, `day-hub.tsx` (fliksraden), `today.tsx` och dagens komponenter (bara ytor och avstånd), kontrollerna i `calendar-planner.tsx`/`calendar.tsx` (bara presentation, ingen geometri eller hantering av händelser), `impact-checkin.tsx` och översättningar i `i18n`, `health.tsx`, tokens i `styles.css`.
- Rörs inte: day-capacity, day-pace, calendarLoad/Gaps, familjeprojektionen, lagringsnycklar, ID:n och sökvägar.
- Verifiering: testsviten, typkontroll och bygge, samt Playwright på /idag, /kalender, /quickflow och /halsa på mobil (390 och 360 px) och dator. Inget överflöde och inga konsolfel.
- CHANGELOG och changelog.ts uppdateras.

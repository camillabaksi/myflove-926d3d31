# Min dag, barnens dagar och Familj – separerade men kopplade

## Mål
Användaren ser alltid "vems dag tittar jag på?". Min dag = min dag, barnets dag = barnets dag, Familj = helheten. Flow kopplar ihop dem via befintlig batteri-/FlowScore-logik – aldrig via påhittade energikostnader.

## Vad användaren får

1. **Personväxlare** överst i Dagsvyn (Idag) och i Family Flow:
   `[Min dag] [Bella] [Bianca] [Familj]` – barnen visas dynamiskt med namn och avatar. Vald person står tydligt i rubriken ("Bellas dag").
2. **Min dag** visar bara mina egna aktiviteter. Barnaktiviteter syns endast om de är markerade "kräver mig" eller kopplade till en av mina aktiviteter – då med etiketten *Familj · Barn* och en diskret rad "Kopplad: Bella – Förskola".
3. **Barnets dag** – enkel lista med pictogram, områdesfärg och Nu/Nästa (samma rad som Dagsvyn).
4. **Familj** – välj personer med bockrutor (Du, Bella, Bianca, Alla).
   - Desktop: tidslinje med kolumner `Tid | Du | Bella | Bianca`.
   - Mobil: staplad tidslinje per klockslag, en rad per person med liten avatar – ingen sidscroll. Gemensamma aktiviteter (samma titel och tid, eller kopplade) visas som **en** rad med flera avatarer i stället för dubbletter. Nu/Nästa markeras.
5. **Kopplingar** i aktivitetens åtgärdsmeny: "Koppla till…", "Ta bort koppling" (aktiviteterna ligger kvar). När tiden ändras på en kopplad aktivitet visas en fråga: "Uppdatera även Bellas aktivitet?" – Bara denna / Båda. Ingen automatisk massändring.
6. **Flow-förslag för tät eftermiddag**: räknar förälderns tid/närvaro (kräver mig, förberedelse, resa, övergång) i ett tidsfönster, vägt mot batterinivå. Låg nivå + tätt → t.ex. "Din eftermiddag är ganska tät och du har 35 % batteri. Vill du förenkla middagen och lägga in 20 min återhämtning efter hämtningen?" med knappar till Återhämtning/QuickFlow. Mönster formuleras försiktigt ("Du har tidigare loggat att liknande eftermiddagar tar mycket energi") och bara när egna loggar finns.

## Datamodell – ingen ny tabell
- Kopplingar sparas i befintligt metadata-kuvert på aktiviteter (`notes`-metadata för barnaktiviteter, motsvarande metadata för egna uppgifter): ett `linkGroup`-id + referens till kopplade instanser. Kopplingar följer befintlig RLS och skapar inga nya delningar.
- Gemensam aktivitet för flera barn = en `linkGroup` som delas av aktiviteterna; visningen slår ihop dem.
- Bakåtkompatibelt: aktiviteter utan metadata fungerar som idag.

## Teknisk sektion
- `src/lib/family-perspective.ts` (ny, ren logik): `filterMyDay`, `childDay`, `buildParallelTimeline(people, items)` → rader med sammanslagna gemensamma aktiviteter, `detectDenseWindow(parentDemands, batteryLevel)`.
- `src/lib/activity-links.ts` (ny): encode/decode `linkGroup` i befintliga metadata, `linkActivities`, `unlinkActivity`, `linkedSiblings`.
- `useFlowItems`: sluta lägga in alla `childEvents` i Min dag; behåll endast `requiresParent` eller länkade. `useChildEvents`, `useFamilyLoad`, `useRecoveryGaps` oförändrade i ansvar.
- Komponenter: `components/day/person-switcher.tsx`, `components/day/family-timeline.tsx`, `components/day/linked-change-dialog.tsx`; återanvänder raden i `daily-flow-list.tsx`, `ActivityPictogram`, `dailyActivityVisual`, områdesfärgerna.
- Integration: `src/pages/today.tsx` och `src/pages/family-flow.tsx` får växlaren; Kalenderns dagläge oförändrat utöver filtret.
- Förslaget för tät eftermiddag byggs ovanpå `family-load.ts` + `useEnergyBattery` och visas i befintliga Family Load-kortet/Next Step.
- Tester (vitest) för alla fall i listan: 1 och 2 barn, samma/olika aktiviteter, koppling, gemensam aktivitet, tidsändring, ändra bara en, ta bort koppling, Min dag med/utan barnaktivitet, låg/medel/hög batteri, tät dag. Playwright 360/375/390/430/1280 px. Typecheck + build. CHANGELOG + `src/lib/changelog.ts`.

## Antaganden (säg till om fel)
- Två barnaktiviteter räknas som "samma" automatiskt om titel och starttid är lika; annars krävs en koppling.
- Ingen ny sida – allt sker i befintliga Idag och Family Flow.

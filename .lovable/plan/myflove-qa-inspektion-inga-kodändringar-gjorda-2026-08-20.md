# MyFlove – QA-inspektion (inga kodändringar gjorda)

Genomgång av koden efter steg 1–4 (ny navigation, Min dag som kärna, förenklad Hem, samlat Flow). Nedan de 10 viktigaste observationerna, prioriterade.

## 🔴 Kritiska

**1. "Anpassa hemskärmen" beskriver en hemskärm som inte finns längre**
`src/lib/home-sections.ts` listar fortfarande Livspusslet, Dagen just nu, Daily Flow – dagens viktigaste, Medicinpåminnelser, Genvägar, Hjälp mig, Förslag just nu, Väder, Veckan i flow, Din svit, Räkningar, Flow Reset. Nya `src/pages/home.tsx` renderar bara hälsning, batteri, Nästa, ett förslag, ＋ Lägg till och tre vägar. Användaren kan alltså slå på/av och sortera block som aldrig syns.
Rekommendation: krymp listan till det Hem faktiskt visar, eller flytta de bortvalda blocken till Min dag och låt Anpassa styra Min dag i stället.

**2. Tre parallella "vad är viktigast"-ytor visas fortfarande samtidigt**
Flow → NU (`src/pages/flow.tsx` + `flow-engine.ts`), Min dag har både ett eget AI-förslag och `DailyFocusCard` (`src/pages/my-day.tsx:186`), och Hem har `useSingleSuggestion`. Tre olika algoritmer kan ge tre olika svar på samma fråga samma minut.
Rekommendation: låt `flow-engine` vara enda källan. Min dag bör visa Flows förslag (samma text) och `DailyFocusCard` bör tas bort eller reduceras till en länk till Flow → NU.

**3. Namnfloran är fortfarande blandad i UI-texter**
"Daily Flow", "Dagens fokus", "FlowPlan", "Vad ska jag göra nu?" finns kvar i bl.a. `src/components/daily-focus-card.tsx`, `src/components/flow-onboarding.tsx`, `src/pages/calendar.tsx`, `src/pages/studyflow.tsx`, `src/pages/workflow.tsx`, `src/lib/life-puzzle.ts`, `src/lib/npf-mode.ts` och landningssidan `src/routes/index.tsx`. Routes pekar rätt, men orden gör att det känns som flera produkter.
Rekommendation: en språkpass där allt heter Flow (NU / IDAG / HJÄLP) och "Min dag".

## 🟡 Viktiga

**4. "Daglig rutin" (`/daglig-rutin` → `src/pages/daily-flow.tsx`) konkurrerar med Min dag**
Den ligger kvar i Mer-gruppen "Min dag" och innehåller check-in/fokus/reflektion – samma jobb som Min dag + Flow.
Rekommendation: avgör om den ska bli en ren "kvällsreflektion" eller slås ihop med Min dag.

**5. Fyra energiytor lever kvar bredvid Mitt batteri**
FlowScore, Energiflöde, Veckans flow och Friktionsindex ligger nu under Mer → Avancerat (bra), men Energiflöde finns dessutom som egen flik inne i Må bra, och `src/pages/energy-map.tsx` finns kvar utan route (död kod).
Rekommendation: en väg in per sak – Energiflöde antingen som flik i Må bra eller som egen sida, inte båda. Ta bort energy-map vid nästa städning.

**6. Batteriet renderas på tre sidor**
`EnergyBattery` finns i Hem, Min dag och Kalender. Det är konsekvent, men på Min dag ligger batteriet, energitonad tidslinje och en energimening nära varandra – tre uttryck för samma data.
Rekommendation: behåll batteri + tidslinje, ta bort den extra energimeningen på Min dag.

**7. Samma uppgifter syns flera gånger på Min dag**
Uppgifter med klockslag hamnar både i `DayTimeline` och i `DailyFocusCard` längre ner på samma sida.
Rekommendation: samma dedup-regel som redan gjordes på gamla Hem (visa inte en post två gånger på samma skärm).

**8. Föräldralösa sidor utan route**
`src/pages/energy-map.tsx`, `medication.tsx`, `mood.tsx`, `routines.tsx`, `studies.tsx` importeras inte av någon route. De påverkar inte användaren men gör underhållet dyrare och kan råka länkas in igen.
Rekommendation: radera vid nästa städning.

## 🟢 Kosmetiska

**9. Mer-menyn har fortfarande många ingångar**
Nio grupper och ~35 poster. Strukturen är rätt (Min dag · Flow · Studier · Jobb · Familj · Hemma · Resor · Insights · Avancerat · Inställningar), men "Att göra", "Kalender" och "Påminnelser" ligger både i bottennavets valbara platser och i Mer.
Rekommendation: ingen ändring krävs för funktion; ev. kortare hintar.

**10. Tomma tillstånd är hanterade – inga ändringar behövs**
Flow NU faller tillbaka på en lugn mening när inget finns, Hem visar "Nästa"-kortet bara vid innehåll, och Min dags tidslinje har tomtext. Även gamla routes är korrekt omdirigerade: `/assistant`, `/vad-nu`, `/flowplan`, `/fokus` → `/flow`; `/dump` → `/quickflow`; `/calendar` → `/kalender`; `/studier` → `/studyflow`. Djuplänken `/assistant/$chatId` fungerar fortfarande. Bottennavet följer principen Hem / Min dag / QuickFlow / Flow / Mer, och Flow verifierades i mobilbredd (390px) i förra steget.

## Ordning när vi använder credits igen

1. Synka "Anpassa hemskärmen" med den nya Hem (obs 1).
2. En enda förslagskälla: Flow-engine driver Hem, Min dag och Flow (obs 2 + 7).
3. Språkpass: bort med Daily Flow / FlowPlan / Vad ska jag göra nu? i UI-text (obs 3).
4. Beslut om /daglig-rutin och Energiflöde-dubbleringen (obs 4 + 5).
5. Städa död kod: föräldralösa sidor och extra energimening (obs 6 + 8).

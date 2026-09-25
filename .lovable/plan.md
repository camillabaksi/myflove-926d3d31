# Städning steg 1 – En enda prioritetsmotor

Auditten är godkänd. Steg 1 genomförs först. Därefter görs full verifiering och en rapport, och sedan stannar arbetet innan steg 2.

## Målbild
`priority-engine` blir den enda källan till prioritet: P1 Måste göras, P2 Bör göras, P3 Kan vänta, P4 Extra. QuickFlows ord ("Nu", "Sedan", "Kan vänta", "Om du orkar") blir bara presentation av P1–P4.

## Vad som ändras
1. **Översättning i priority-engine**
   - `bucketToPriority`: nu→1, sedan→2, kan-vanta→3, om-du-orkar→4.
   - `priorityToBucket`: samma mappning åt andra hållet, så att gammal lagring och serversvar fungerar.
   - `QUICKFLOW_LABEL`: P1 "Nu", P2 "Sedan", P3 "Kan vänta", P4 "Om du orkar". Detta är bara visningsord.
2. **QuickFlow-sorteringen (quickflow-priority.ts)**
   - `heuristicPriority` klassar via `classifyPriority` i priority-engine, i stället för egna ordlistor. Batteriprocenten påverkar inte längre prioriteten, i linje med principen att kapacitet inte ändrar prioritet.
   - `sortPriority`/`bucketRank` sorterar på P-nivå från motorn.
   - `BUCKET_META` visar etiketter från `QUICKFLOW_LABEL`, i ordningen P1→P4. Då hamnar "Kan vänta" före "Om du orkar".
   - `splitTasks` ligger kvar, eftersom den är textuppdelning och inte prioritet.
   - `energyHint` ligger kvar tills vidare och städas i steg 5 (Flow-texter).
3. **Gammal data**
   - Sparade poster med `bucket` (nu/sedan/om-du-orkar/kan-vänta) läses in och översätts till P1–P4 när de läses. Ingenting skrivs om och ingenting raderas.
   - Nya poster sparar fortfarande ett giltigt `bucket`-värde, så att äldre appversioner på andra enheter fungerar vid synk.
   - Uppgifternas fält `quickflowBucket` i Idag behålls och tolkas på samma sätt.
4. **AI-prioriteringen (quickflow-priority.functions.ts)**
   - Svaret valideras som idag. Varje post körs sedan genom `priorityToBucket(bucketToPriority(...))`, så att bara motorns fyra nivåer kan förekomma.
   - Prompten får P1–P4-definitionerna från motorn i stället för egna beskrivningar.

## Vad som inte ändras i steg 1
- Kapacitetsläget, FlowPlan-kort, Flow-texter och batteriet. De hör till steg 2–5.
- Ingen kod raderas.

## Verifiering efter steg 1
- Nya enhetstester: mappningen åt båda hållen, att gamla bucket-värden läses rätt och att heuristiken ger samma P-nivå som `classifyPriority`.
- Befintliga tester för quickflow-priority och priority-engine ska passera. Förväntningar som byggde på batteristyrd ordning uppdateras.
- Typecheck, hela testsviten och build.
- Kontroll i webbläsaren på mobil (390 px), inloggad: QuickFlow-listan visar befintliga poster med rätt nivå, att lägga till och sortera fungerar, Hem och Idag visar QuickFlow-sakerna oförändrat och ingen horisontell scroll uppstår.
- Synk i molnet: listan laddas om efter omladdning utan att poster försvinner.
- CHANGELOG och changelog.ts uppdateras. roadmap.md får steg 1–10.

## Tekniska detaljer
Filer: `src/lib/priority-engine.ts`, `src/lib/quickflow-priority.ts`, `src/lib/quickflow-priority.functions.ts`, `src/hooks/use-priority-list.ts` (normalisering vid läsning), `src/components/quickflow-priority.tsx` (etiketter), plus tester. `PriorityBucket` finns kvar som lagringstyp för kompatibilitet och markeras som presentation.

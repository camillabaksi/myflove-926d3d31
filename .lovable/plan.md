# MyFlove – Audit inför städning (ingen kod ändrad)

Omfång idag: 82 routes, 55 sidor, ca 87 hooks, ca 218 hjälpfiler i lib. Oanvänd kod är hittad genom att söka efter importer. Därför kontrolleras varje "ta bort" en gång till innan något raderas.

## Kärnan idag – hur den faktiskt hänger ihop

```text
Uppgifter/händelser  -> useTasks, kalender, barnschema, rutiner  -> useFlowItems (en gemensam daglista)
Prioritet            -> priority-engine (Måste idag/Bör/Kan vänta/Extra)
                        + quickflow-priority (nu/sedan/om-du-orkar/kan-vänta)  <- DUBBEL
Kapacitet            -> useCapacityMode (Fullt/Mellan/Lågt) HÄRLEDS från batteri-% (useEnergyBattery)
Planering            -> FlowPlan (flow-plan-content) + capacity-plan-card på Hem
Flow                 -> FlowView (chatt/planera/flow) + flow-personality
```

## A. BEHÅLL
- **Gemensam daglista (useFlowItems + daily-flow-list):** den enda källan för Min dag, Kalender och Hem. Säkert.
- **priority-engine + useCapacityMode:** har redan rätt modell (P1–P4, Fullt/Mellan/Lågt). Det blir den centrala motorn.
- **Återhämtning, Family Flow, Träning, Studier, Insikter:** fungerar och har testats nyligen.
- **Flow-personligheten (flow-personality.ts):** rätt ton redan. Den behöver bara användas överallt.
- **Cloud sync, auth, ACTIVITY_DONE_EVENT:** rörs inte.

## B. FÖRENKLA
- **Orkkortet (OrkSummary) och sidan Mitt batteri:** visar "Låg/Lagom/God ork" och procent. Det krockar med Fullt/Mellan/Lågt. Förslag: visa kapacitetsläget med ikon och text (🟢 Fullt / 🟡 Mellan / 🔴 Lågt) och ett tryck för att byta. Batteriets kurva flyttas in bakom "Hur räknas det?". Säkerhet: medel.
- **Orkfrågan (ork.ts: Mycket/Okej/Lite/Nästan slut):** fyra nivåer medan kapaciteten har tre. Förslag: låt svaret sätta kapacitetsläget direkt. Säkerhet: medel.
- **Flow-texter:** varje område har sina egna texter (energyHint, personal-messages, adaptive-*, påminnelser). Förslag: en gemensam textkälla, med kortare text vid Lågt. Säkerhet: hög.
- **Empty states:** tomma listor har olika formuleringar. De görs enhetliga, till exempel "Det är tomt här just nu." Säkerhet: hög.

## C. SLÅ IHOP
1. **Två prioritetssystem.** `quickflow-priority.ts` (buckets nu/sedan/om-du-orkar/kan-vänta + heuristicPriority) används av QuickFlow-listan, use-priority-list, use-quickflow-prioritization, dump och flow-item-card. Parallellt finns `priority-engine.ts` (P1–P4). Förslag: QuickFlow mappar till P1–P4 via priority-engine. Gamla bucket-värden i sparad data översätts vid inläsning. Påverkar: QuickFlow, Brain dump, sparad lista. Säkerhet: medel, eftersom data behöver migreras i klienten.
2. **Tre energikällor bakom kapaciteten.** useEnergyBattery (procent), useFlowScore (poäng) och useEnergyFlow (net-poäng från aktiviteter) räknas ihop till procent, och kapaciteten härleds sedan ur den procenten. Förslag: kapacitetsläget blir källan. Användarens val och orkfrågan styr i första hand, och batteriet blir bara en tyst standardgissning. Påverkar ca 14 filer som läser `reading.now`. Säkerhet: medel.
3. **Planeringsytor:** FlowPlan, capacity-plan-card, flow-replan/flow-replan-diff och adaptive-activity-card föreslår alla "vad nu". Förslag: FlowPlan äger ordningen och de andra visar bara dess resultat. Säkerhet: medel.
4. **Hopfällning:** både CollapsibleSection, step-section (oanvänd) och `<details>` på Pitch. Standardisera till CollapsibleSection. Säkerhet: hög.

## D. TA BORT (hittade utan importer, kontrolleras innan radering)
- Komponenter: adaptive-lead-settings, all-in-day, calm-mode, day-timeline, enable-push-button, flow-onboarding, flow-reset, focus-mode, myflove/modal, personal-push-settings, quickflow-triage, quiet-mode-settings, step-section, task-energy-prompt, workout/exercise-illustration (ersatt av foton).
- Hooks/lib: use-flow-home, activity-semantics, ai-assistant, ai-gateway.server, area-premium, brain-dump, help-me, personal-messages, quickflow-understand, video.functions.
- Sida: pages/week-flow.tsx (ingen route använder den).
- Oanvända shadcn-komponenter (ca 30 st, t.ex. sidebar, chart, carousel) får ligga kvar eftersom de inte kostar något. Förslag: behåll.
- **Energikostnad per aktivitet (task.energyImpact "drains"/…) och Energiflöde-poäng:** används fortfarande av batteriet och Insikter, så de tas **inte** bort nu. De görs frivilliga och döljs som huvudbegrepp.

## E. FLYTTA
- **Mitt batteri / Energins historik** i Mer → Hälsa & ork: byter namn till "Kapacitet & mönster" och ligger under Insikter.
- **Energiflöde-inställningar:** flyttas till Inställningar → Avancerat.
- **Demo-banner och demo-seed-data:** visas bara för demokontot, aldrig i vanliga flöden. Det kontrolleras.

## F. TEKNISK STÄDNING (samma beteende)
- `src/pages` + `src/compat/wouter.tsx`: sidorna använder fortfarande wouter-skiktet ovanpå TanStack. De behålls i denna fas, eftersom en omskrivning är för riskabel. Det dokumenteras.
- 18 routes är bara redirects från gamla vägar. Behåll dem, eftersom de skyddar gamla länkar.
- Stora filer: layout.tsx (41k), use-data.ts (35k), studyflow.tsx (35k) och assistant-content.tsx (31k). Endast fler rena utbrytningar görs, utan logikändring.
- changelog.ts innehåller 54 omnämnanden av "batteri". Historiken lämnas som den är.
- i18n-dicts/battery.ts: termerna uppdateras till Kapacitetsläge/Fullt/Mellan/Lågt.

## G. RISKER
- **Sparad data:** QuickFlow-buckets och energivärden finns i molnsynkad lagring. Därför behövs översättning vid inläsning, inte radering.
- **Batteri-% används i logik:** heuristicPriority, adaptive-activity, family-load, lågkapacitets-påminnelser och Flow-kontext. Varje ställe byts ett i taget, med tester.
- **Dynamiska importer:** vissa "oanvända" filer kan laddas via lazy/strängar. Därför söks det en gång till innan något raderas.
- **Texter i översättningscachen:** ändrade svenska texter översätts om automatiskt, men engelskan kan tillfälligt vara gammal.

## Genomförande efter ditt godkännande (små steg, verifiering efter varje)
1. Ta bort bekräftat oanvänd kod (D). Kör typecheck, tester och build.
2. Kapacitetsläget blir huvudbegrepp i Hem, Mitt batteri och orkfrågan (B + C2). Kontroll i mobil 360–430.
3. QuickFlow använder priority-engine, och gammal data översätts (C1).
4. FlowPlan äger "vad nu", och övriga kort läser därifrån (C3).
5. Flow-texter, empty states, termer i i18n och flytt i Mer (B, E).
6. Tillgänglighet: kontroll av touch targets och etiketter (ikon + text för kapacitet), kontrollsvep på mobil.
7. CHANGELOG och intern översikt (ARCHITECTURE.md) uppdateras.

Säg vilka punkter du vill behålla, ändra, slå ihop eller ta bort, eller godkänn allt.

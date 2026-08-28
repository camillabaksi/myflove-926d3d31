# MyFlove – åtgärdsplan efter read-only QA

Ingen kod har ändrats i QA-steget. Den här planen beskriver de tre saker
som bör åtgärdas innan bred extern demo, plus två mindre uppstädningar.

## 1. En enda sanning för "är rutinen klar idag?"

Rutinernas avbockning finns idag i fyra parallella system, vilket är
grundorsaken till att t.ex. "Duscha" kan ligga kvar under **Nästa** på Hem
trots att den är avbockad i **Rutiner & medicin** strax nedanför:

- `src/hooks/use-done-log.ts` sparar i `myflove-done-log` (används av Idag och Flow)
- `src/components/routines-medication-today.tsx:36-53` sparar i `myflove-routines-done`
  eller i en matchande påminnelse (används av Hem-blocket)
- `src/pages/home.tsx:134-143` (`useNextEvent`) läser ingen klar-status alls
- `src/hooks/use-day-done.ts:29-34` räknar bara påminnelser

Åtgärd: gör `useDoneLog` till enda källan för rutiner. Låt Hem-blocket,
`useNextEvent` och `useDayDone` läsa och skriva via samma hook, och migrera
befintlig `myflove-routines-done`-data in i `myflove-done-log` en gång.

## 2. Rutinens upprepning respekteras inte överallt

`routineOccursOn` (`src/pages/routines.tsx:30`) används i Hem-blocket,
påminnelsesynken och `useDayDone`, men **inte** i:

- `src/hooks/use-flow-items.ts:169-185` (Idag, Flow, Att göra)
- `src/pages/home.tsx:134-143` (Nästa)

Följden är att en veckorutin eller engångsrutin dyker upp varje dag i Idag
och som Nästa. Åtgärd: lägg till samma `routineOccursOn`-filter på båda
ställena så att veckovis och engångs faktiskt betyder något.

## 3. Demoläget i Insight ska inte nås av vanliga användare

`src/pages/insight.tsx:207-210` styr demoläget enbart på query-strängen
`?demo=1`, och `:511-518` renderar dessutom en synlig knapp
"Öppna demoläge med fiktiva testprofiler" mitt i den vanliga vyn.
Vem som helst kan alltså klicka sig in i fiktiva testprofiler, och en delad
URL med parametern visar demodata.

Åtgärd: dölj knappen och blockera `?demo=1` för alla utom admin
(`src/hooks/use-is-admin.ts` finns redan), alternativt bakom en flagga i
Inställningar. Ingen ändring av själva demodatan behövs.

## 4. Namnröran kring Planera (mindre)

- `src/routes/_app.flow.tsx:6` och `_app.flowplan.tsx:6` har båda "Planera"
  i sin `<title>`, trots att navet kallar dem "Flow hjälper" respektive
  "Planera". Ge `/flow` en egen titel.
- `src/lib/app-guide.ts` saknar `/flowplan` helt, trots att den är
  `essential: true` i navet (`src/components/layout.tsx:426`). Lägg till den.
- Övriga titel/nav/guide-krockar att synka samtidigt: `/studyflow`
  (Studier / StudyFlow), `/studybuddy` (Studiehjälp / StudyBuddy),
  `/workflow` (Jobbplanering / WorkFlow), `/energifloede`
  (Energins historik / Min energi).

## 5. "Energins historik" som egen pelare (mindre)

`src/pages/health.tsx:33` visar `/energifloede` som en tredje pelare bredvid
Träning och Medicin, men `EnergyFlowContent` renderas redan som flik inne i
Mitt batteri (`src/pages/battery.tsx:85-95`) och länkas ut därifrån igen
(`:98-103`). Samma innehåll, tre vägar in.

Åtgärd: ta bort kortet i Hälsa och låt Mitt batteri äga innehållet. Routen
kan ligga kvar för djuplänkar.

## Ordning

1 och 2 hör ihop och bör göras i samma pass (båda rör rutinmodellen).
3 är snabb och viktigast inför extern demo. 4 och 5 är rent språk och IA.

## Vad som inte behöver röras

Medicin (en källa via `src/lib/medications.ts`), avcheckning av uppgifter
och QuickFlow (en `toggleItem` i `use-flow-items.ts`), kryptering
(`secure-local.ts`), utloggning/kontoradering och analytics-sanering är
verifierat intakta och ska inte ändras.

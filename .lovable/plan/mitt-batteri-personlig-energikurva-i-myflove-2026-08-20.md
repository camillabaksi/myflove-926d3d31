# Mitt batteri – personlig energikurva i MyFlove

Ett lugnt, levande batteri som visar hur mycket energi du har nu, hur den rör sig över dagen, och när dina starkaste och svagaste stunder brukar ligga. Det bygger helt på funktioner som redan finns – inget nytt parallellt system.

## 1. Vad som återanvänds (inget dubbleras)

- `src/lib/energy-pattern.ts` – bygger redan snitt-energi per timme (0–23) ur dina loggar i Energikartan, med `reliable`-flagga och `expectationFor()`. Det ÄR redan "lär sig ditt mönster".
- `src/hooks/use-energy-pattern.ts` – laddar 30 dagars `energy_logs`. Batteriet läser samma hook.
- `src/lib/flowscore.ts` + `use-flowscore.ts` – nuvarande kapacitet (0–100), bokad tid, klart idag, öppna tankar. Batteriets **nivå just nu** = FlowScore, inte ett nytt tal.
- `src/lib/energy-flow.ts` + `use-energy-flow.ts` – ger/tar-poster, vikter, av/på. Batteriets **rörelse hittills idag** kommer härifrån.
- `Task.energyImpact` och `Task.friction` finns redan i `src/hooks/use-data.ts` och sätts i `task-quick-add.tsx`. Ingen ny form behövs.
- `DayTimeline` (`src/components/day-timeline.tsx`) och kalenderns dagsvy – batterikurvan ritas bakom samma timrad.

## 2. Vad som behöver läggas till

**Ny ren logik: `src/lib/energy-battery.ts`** (enda nya "hjärnan")

- `buildBatteryCurve({ pattern, flowNow, todaysItems, energyFlowBalance, now })` returnerar ett värde 0–100 per halvtimme för hela dagen:
  - baslinje = ditt personliga mönster per timme (fallback: mjuk generisk kurva när `reliable === false`, tydligt märkt "preliminär").
  - kalibrering: kurvan förskjuts så att den träffar dagens faktiska FlowScore vid "nu".
  - dagens händelser/uppgifter drar kurvan ned/upp framåt i tiden efter `energyImpact` + `friction` (kostar/neutral/ger, liten intensitetsskala).
  - `energyFlow`-poster påverkar redan passerad del av kurvan.
- Härledda värden: `peak` (starkaste fönster), `dip` (svagaste fönster), `trend` ("stiger" / "planar ut" / "sjunker"), `overloaded` (summan av kostnad framåt > tillgänglig nivå).
- `recommendPlacement(tasks, curve)` – matcha hög-fokus-uppgifter mot peak, lätta mot dip. Återanvänder `maxFriction` från FlowScore.

**Ny hook: `src/hooks/use-energy-battery.ts`** – kombinerar de tre befintliga hookarna, inga nya nätverksanrop, ingen ny tabell.

**Ny komponent: `src/components/energy-battery.tsx`**

- Kompakt läge: liggande batteri, mjuk vätskefyllning som animeras med CSS-transition (600–900 ms, ease-out), procent + en rad text ("Stiger – toppen runt 10–12"). Respekterar `prefers-reduced-motion` (då: statisk fyllning, ingen puls).
- Expanderat läge (progressiv fördjupning, samma kort): liten kurva över dagen med markerade peak/dip, "nu"-markör, och 2–3 konkreta förslag ("Flytta _Deklaration_ till 10:00", "Lägg in 20 min paus 14:30").

## 3. Var det ligger i gränssnittet

- **Kalendern blir hemvist.** Batteriet läggs som en smal, alltid synlig rad högst upp i `src/pages/calendar.tsx`, ovanför vyväxlaren – ett tryck expanderar det. Kalendern behåller allt annat (lägga till/ändra/ta bort) oförändrat.
- **Dagsvyn:** kurvan ritas som mycket svag bakgrundsgradient bakom `DayTimeline`, så du ser vilka timmar som är starka utan att läsa något.
- **Hemskärmen:** samma komponent i kompakt läge som ett nytt valbart block `batteri` i `src/lib/home-sections.ts`, placerat överst.
- **Må bra / Energiflöde:** länk in i det expanderade läget – inga nya sidor.

## 4. Ordning att bygga i

1. `energy-battery.ts` (ren logik + tester på kurvan, peak/dip/trend).
2. `use-energy-battery.ts` – kopplar ihop befintliga hooks.
3. `energy-battery.tsx` kompakt + animation, `prefers-reduced-motion`.
4. Placering: kalendertopp → hemskärmsblock → bakgrundskurva i dagsvyn.
5. Expanderat läge med peak/dip och förslag (placering + överbelastad dag).
6. CHANGELOG.md + src/lib/changelog.ts.

## Antaganden

- Ingen ny databastabell; allt härleds ur `energy_logs`, uppgifter och energiflödespunkter. Om vi senare vill spara kalibrering per dag lägger vi den i `user_kv`.
- Energipåverkan per aktivitet sätts med de befintliga chipsen (ger / neutral / kostar) – inget nytt formulär, och kalenderhändelser utan angiven påverkan behandlas som neutrala tills du säger annat.

# MyFlove – UX-, språk- och strukturstädning 1.0 (analys + plan)

Ingen kod ändras i detta steg. Nedan står vad som redan är klart, vad som faktiskt saknas och i vilken ordning det bör göras för minsta möjliga credit-förbrukning.

## A. Redan genomfört (kräver ingen ny insats)

Verifierat i koden:

- Huvudnavigationen är redan Hem · Min dag · QuickFlow · Planera · Mer (`src/components/layout.tsx`).
- Språkbytet är i huvudsak gjort: navet och menyerna säger "Min dag", "Planera", "Dagens balans", "Mina mönster", "Studier", "Jobb", "Studiehjälp", "Rutiner & medicin". `/daglig-rutin` heter "Rutiner & medicin" i UI.
- En gemensam rekommendationsmotor finns: `src/lib/flow-engine.ts` (`suggestNow`, `rankNow`, `assessToday`, `suggestMove`) och används av Hem, Min dag och Planera. Ingen konkurrerande motor är kvar i vyerna.
- Gemensam aktivitetsmodell + avbockning finns: `use-flow-items.ts` + `use-done-log.ts` med universell `toggleItem`, delad av Hem, Min dag, Kalender och Att göra.
- Kalender har redan Tidslinje / Allt i dagen som två lägen av samma data (ingen dubblett).
- Dubblettvyer är redan sammanslagna via redirects: `/min-dag`, `/vad-nu`, `/flowplan` pekar alla vidare.
- Minimering/expandering med sparat läge finns på Hem, Min dag, Planera, Kalender m.fl.
- "Anpassa hemskärmen" (`src/lib/home-layout.ts`) listar 11 block och alla 11 renderas faktiskt på Hem – inga föräldralösa block.
- Mående 1–10 och Energi 1–10 finns som separata sliders på Hem och Min dag, med en post per dag.

## B. Verkliga luckor (det som återstår)

1. **FlowPlan-sekvensen är inte längre synlig.** `planFlowSequence` i `src/lib/flowplan.functions.ts` anropas inte av någon vy. Fliken "Planera min dag" i `/flow` visar bara dagens belastning + ett flyttförslag – ingen ordnad lista (Lämna barnen → handla → tvätt → paus …). Detta är den enda punkten där funktionalitet i praktiken har tappats.
2. **"Jag gjorde något" ligger i ett eget system.** `did-this-cta.tsx` skriver bara till `energy_factors` och blir aldrig en genomförd aktivitet i den gemensamma modellen, alltså syns den inte i "Genomfört idag" i Min dag.
3. **Otydliga rubriker/undertexter på Hem.** "Lägg till" saknar undertexten "Planera något", "Jag gjorde något" saknar "Registrera något du redan gjort", QuickFlow saknar "Fånga en tanke snabbt".
4. **Energi upplevs som två system.** `/energifloede` ligger som egen huvudingång i menyn i stället för som historik/mönster under Min energi. Även Hem-blocket "Dagens energi" konkurrerar med batteriet.
5. **Kvarvarande interna ord i sidrubriker.** Enstaka ställen säger fortfarande "Friction/Friktion" i stället för "Svårighetsgrad", och `/flowscore`-sidan bör konsekvent heta "Dagens balans" med en enkel förklaringsrad.
6. **Möjligt skräp att verifiera:** `src/pages/assistant.tsx` som egen route, `week-flow`, `friction-index`, `energy-map`, `proactive-suggestions.tsx`, `daily-flow-card.tsx`, `help-me-modal.tsx`, `week-in-flow.tsx`. Endast det som bevisligen är oanvänt tas bort.

## C. Onödigt / ska inte göras

- Ingen ny aktivitetsmodell, ingen ny motor, ingen ny navigation – finns redan.
- Ingen visuell redesign.
- Ingen ändring av Free/Premium.
- Inga fler redirects – de som behövs finns.

## D. Prioriterad, credit-snål ordning

**Steg 1 – Planera min dag får tillbaka sin sekvens (störst värde)**
Koppla `planFlowSequence` till fliken "Planera min dag" i `/flow`: knapp "Föreslå en ordning" → numrerad lista med möjlighet att flytta rader → "Använd planen", som sparar ordningen så att Min dag kan visa den. Återanvänder befintlig serverfunktion och `FlowItemActions`. Ett filbyte plus en liten lagringsnyckel.

**Steg 2 – "Jag gjorde något" skriver till den gemensamma modellen**
Vid sparning skapas även en genomförd aktivitet (samma väg som `useDoneLog`) utöver energiposten, med dedup så inget dubbleras. Då syns den i "Genomfört idag" och i Allt i dagen.

**Steg 3 – Språk och undertexter (billigt, rent presentationslager)**
Undertexter på Lägg till / Jag gjorde något / QuickFlow, "Friktion" → "Svårighetsgrad", "Dagens balans" med en förklarande mening på `/flowscore`.

**Steg 4 – Energi som en sak**
`/energifloede` flyttas i menyn till underrubrik "Historik och mönster" under Min energi; batteriet blir den enda energivisningen på Hem, och Hem-blocket "Dagens energi" behålls men beskrivs som historik. Routen finns kvar.

**Steg 5 – Verifierad städning**
Sök referenser till de fyra misstänkta komponenterna och ta bort endast de som saknar importer.

**Steg 6 – QA**
Ett Playwright-pass med testkontot: Hem → checka av → syns i Min dag och Kalender; QuickFlow med klockslag; Planera min dag ger en ordning; ingen aktivitet dubbleras; minimeringar sparas.

## E. Tekniska anteckningar

- Berörda filer per steg: 1) `src/pages/flow.tsx` + ny liten `src/lib/day-plan.ts`, 2) `src/components/did-this-cta.tsx`, 3) `src/pages/home.tsx`, `src/pages/flowscore.tsx`, `src/components/layout.tsx`, 4) `src/components/layout.tsx` + `src/pages/home.tsx`, 5) borttagningar, 6) test.
- Inga databasändringar krävs; `energy_factors`, `user_kv` och befintliga hooks räcker.
- `CHANGELOG.md` och `src/lib/changelog.ts` uppdateras vid varje steg.

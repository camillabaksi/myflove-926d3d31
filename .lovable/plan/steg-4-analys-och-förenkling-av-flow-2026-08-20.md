# Steg 4 – Analys och förenkling av Flow

Endast analys och plan. Ingen kod ändras, inget raderas i detta steg.

## Vad som finns idag (verifierat i koden)

Flow-relaterade vyer och routes:

| Route                               | Fil                                        | Vad den gör                                                 |
| ----------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `/assistant` (heter "Flow" i navet) | `src/pages/assistant.tsx` (457 rader)      | AI-chatt med historik, snabbprompter, coach-hälsning        |
| `/flowplan`                         | `src/pages/flowplan.tsx` (515 rader)       | AI-sekvens av dagens uppgifter + `DailyFocusCard`           |
| `/vad-nu`                           | `src/pages/what-now.tsx` (216 rader)       | "Vad ska jag göra nu?" – ett förslag i taget + fokusläge    |
| `/min-dag`                          | `src/pages/my-day.tsx` (259 rader)         | Cockpit: batteri, tidslinje, `DailyFocusCard`, `FlowReplan` |
| `/flowscore`                        | `src/pages/flowscore.tsx`                  | FlowScore-poäng som eget system                             |
| `/energifloede`                     | `src/pages/energy-flow.tsx` (394 rader)    | Energipoäng, vikter, inställningar                          |
| `/friktionsindex`                   | `src/pages/friction-index.tsx` (470 rader) | Friktionsbibliotek med röstning                             |
| `/veckans-flow`                     | `src/pages/week-flow.tsx`                  | Veckoöversikt                                               |
| `/daglig-rutin`                     | `src/pages/daily-flow.tsx`                 | **Inte Flow** – rutiner + medicin (namnet vilseleder)       |
| `/quickflow`                        | infångning                                 | Överlappar Flow endast i triage/förslag                     |

Logiklager: `daily-flow.ts`, `focus-rules.ts`, `task-agenda.ts`, `energy-battery.ts`, `flowscore.ts`, `energy-flow.ts`, `friction-match.ts`, `replan.ts`, `flow-diff.ts`, `coach.ts`, `help-me.ts`, `flow-insights.ts`, `life-puzzle.ts`, `flow-personality.ts`, `flowplan.functions.ts`, `flow-chat.functions.ts`.

## Överlappningar jag hittade

1. **Fyra sätt att få "vad ska jag göra nu"**: `/vad-nu` (scoreTask), `/flowplan` (AI-sekvens), `DailyFocusCard` (dagens fokus) och Flow-chattens snabbprompt. Samma uppgiftsdata, fyra rankningsalgoritmer.
2. **`DailyFocusCard` renderas på två ställen** – `/min-dag` och `/flowplan`. Samma kort, samma data.
3. **Tre poängsystem exponerade för användaren**: FlowScore, Energiflöde och Mitt batteri. Batteriet är det enda med begriplig metafor; de två andra är interna signaler som visas som egna vyer.
4. **Friktion visas som eget system** (`/friktionsindex` + `FrictionSuggestion` i workflow/studyflow) trots att `friction-match.ts` egentligen bara är en viktning för hur tung en uppgift känns.
5. **Omplanering finns dubbelt**: `FlowReplan` (min-dag, workflow, studyflow) och `flowplan`s omordning gör i praktiken samma sak.
6. **Död kod**: `proactive-suggestions.tsx` (372 rader), `daily-flow-card.tsx` (357 rader), `help-me-modal.tsx`, `week-in-flow.tsx` importeras inte längre av någon vy.
7. **Namnkollision**: `/daglig-rutin` ("Daily Flow"-filen) har inget med Flow att göra – förvirrar både användare och kod.

## Klassificering

**1. BEHÅLL SOM PRIMÄR DEL AV FLOW**

- Flow-chatten (`assistant.tsx`) – blir lagret HJÄLP
- `flow-personality.ts`, `flow-voice.ts`, `flow-chat.functions.ts`
- `energy-battery.ts` + `EnergyBattery` – enda synliga energimåttet

**2. SLÅ IHOP MED FLOW**

- `/vad-nu` → blir lagret NU inuti Flow
- `DailyFocusCard` → uppgår i NU
- `FlowReplan` + `replan.ts` + `flow-diff.ts` → blir lagret IDAG
- `flowplan`s sekvenslogik (`flowplan.functions.ts`) → driver IDAG-vyn internt
- `coach.ts` + `help-me.ts` → en enda ingång till HJÄLP

**3. GÖM SOM AVANCERAD FUNKTION** (finns kvar under Mer → Avancerat)

- `/flowscore`, `/energifloede`, `/friktionsindex`, `/veckans-flow`, `/insight`

**4. FLYTTA TILL QUICKFLOW**

- Inget. QuickFlow är infångning, Flow är beslut – gränsen är redan tydlig. Enda justeringen: QuickFlow-triagens "föreslå destination" ska anropa samma rankningsmotor som Flow, inte sin egen.

**5. TA BORT SOM SEPARAT VY MEN BEHÅLL LOGIKEN**

- `/vad-nu` och `/flowplan` som egna routes (redirect till `/flow`)
- `flowscore.ts`, `energy-flow.ts`, `friction-match.ts` fortsätter köra internt som insignal till batteri och rankning – men slutar vara egna "system" i gränssnittet

**6. VERKLIG DUBBLETT SOM KAN TAS BORT** (senare, efter verifiering)

- `proactive-suggestions.tsx`, `daily-flow-card.tsx`, `help-me-modal.tsx`, `week-in-flow.tsx` – oanvända
- Dubbelrenderingen av `DailyFocusCard` i `/flowplan`
- Filnamnet `daily-flow.tsx` byter namn till `daily-routine.tsx` (routen `/daglig-rutin` behålls)

## Föreslagen slutlig Flow-struktur

En route: `/flow` (nuvarande `/assistant` behålls som redirect så publicerade länkar fungerar).

```text
FLOW
├── NU      Ett svar. Ett nästa steg. Två knappar.
│           "Du har bra fokus och 72% energi. En uppgift kräver fokus.
│            Vill du börja med den?"   [Ja, börja]  [Senare]
│
├── IDAG    En mening om dagens belastning + max ett flyttförslag.
│           "Din eftermiddag är tung. Flytta städningen till imorgon?"
│           [Flytta]  [Behåll]
│
└── HJÄLP   Chatten. Öppnas när användaren själv ber om den.
```

Inga poäng, inga procenttal utöver batteriet, inga listor av kort. Allt annat (FlowScore, friktion, energiflöde) matar motorn i bakgrunden.

## Återanvändbara delar

- Rankning: `daily-flow.ts:scoreTask` + `focus-rules.ts` + `task-agenda.ts` → slås ihop till en motor, `src/lib/flow-engine.ts`
- Energi: `useEnergyBattery`, `energy-battery.ts` (redan färdig kurva över dygnet)
- Omplanering: `replan.ts`, `flow-diff.ts`, `FlowReplanDiff`
- Handling: `FlowItemActions`, `FocusMode`, `TaskQuickAdd`
- Röst: `flow-voice.ts`, `flow-personality.ts`

## Implementeringsordning (små steg, låg risk)

1. **Motor utan UI-ändring** – skapa `src/lib/flow-engine.ts` som samlar rankning + batteri + friktion till ett svar (`nowSuggestion`, `todayLoad`, `replanSuggestion`). Inga vyer rörs. Verifierbart med typecheck.
2. **NU-lagret** – bygg nya `/flow` med enbart NU-kortet ovanpå motorn. `/assistant` och `/vad-nu` lämnas orörda tills det är verifierat.
3. **IDAG-lagret** – lägg till dagens belastning + ett flyttförslag, driven av `replan.ts`.
4. **HJÄLP-lagret** – flytta in chatten som ett läge i `/flow`, behåll historiken.
5. **Redirects** – `/assistant`, `/vad-nu`, `/flowplan` pekar om till `/flow`. Navet visar bara Flow.
6. **Göm avancerat** – flytta FlowScore, Energiflöde, Friktionsindex, Veckans flow till "Mer → Avancerat".
7. **Städning** – först nu radera oanvända komponenter, efter att steg 1–6 verifierats i preview.

Varje steg är en separat ändring som kan testas för sig, vilket håller nere både regressionsrisk och credits.

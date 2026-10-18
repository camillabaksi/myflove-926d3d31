# Paceable Journal – designrevision, etapp 2 (2026-10-18)

Status: **kodgranskning, inte visuellt verifierad i körande app**. Huvudgren granskad; designändringar i PR #82 är ännu inte sammanslagna. Inga användardata eller produktionsinställningar ändras här.

## Designregler
- 70 % skandinavisk elegans, 30 % modern bullet journal. Varm ivory, plum, lavendel, salvia och aprikos.
- Bricolage Grotesque rubriker, Nunito vardagstext. Undvik dekorativ handstil för vanlig text.
- En gemensam rubrikhierarki, kortyta, sidmarginal, fokusmarkering och klickyta; livsområden behåller sina färgmarkeringar.
- Bevara semantisk textstorlek, zoom, reducerad rörelse och mörkt läge. Journal-linjer/prickar ska vara subtila och aldrig minska läsbarheten.
- **RÖR INTE** `src/components/day/soft-energy-battery.tsx`, dess ringstreck, SVG, procent, nivåer, färger eller logik. Undvik också generella CSS-regler som påverkar batteriet.
- Ingen ändring av lagringsnycklar, kontobehörigheter, barnintegritet eller kalenderdata.

## Inventering av sidfiler
Alla 56 icke-test-TSX-filer under `src/pages/` inventerade. Sidfilens avsaknad av Pace-klasser är en **granskningssignal, inte bevis för fel utseende**: barnkomponenter och `Layout` kan ge gemensam styling.

### Hög prioritet – gemensamma ytor
| Vy | Kodobservation | Nästa kontroll |
| --- | --- | --- |
| Idag (`today.tsx`) | Gemensam typografi, egen dagkort-styling; barnväljare ändras i PR #82 | 320–390 px, 200 % text, barnväxling, batteriet pixelmässigt orört |
| Kalender (`calendar.tsx`) | 1174 rader, huvudsakligen egna vyer; `calendar-planner.tsx` har många egna kort/ytstilar | Dag/vecka/månad, dygn till 24:00, färgprickar, tomläge, popup, tidsplacering |
| Tankar (`dump.tsx`) | Har Pace-typografi men flera `quickflow-*` och notebook-komponenter | Gemensam text och navigering; bevara fysisk för-/nackdels-lista |
| Min plats | Komponeras via Layout/undersidor, inte en enskild fil här | Kontrollera faktiskt routeträd, rubriker, kort och undermenyer |
| Mer/Inställningar (`settings.tsx`) | Pace-designsystem används, men egen styling kvar | Lista, gruppering, avstånd, gamla block, tydliga ikoner |

### Medelhög prioritet – funktionsrika undersidor
| Område | Kodobservation | Nästa kontroll |
| --- | --- | --- |
| Barn (`children.tsx`, `child-schedule.tsx`) | MyFlovePageGrid, egna barnschemakomponenter | Kompakt schema, bildstöd, en delad aktivitet för flera barn, privat data |
| Hälsa (`health.tsx`, `mood.tsx`, `medication.tsx`) | Gemensamma byggstenar men blandad detaljstyling | Rubriker, fält, loggning, diagram, medicinpåminnelser |
| Energi (`battery.tsx`, `energy-flow.tsx`, `energy-map.tsx`) | Både gemensamma och lokala ytor | **Endast omkringliggande sida**; inte SoftEnergyBattery |
| Uppgifter/Påminnelser (`tasks.tsx`, `reminders.tsx`) | Stora sidor, egna element och flera äldre stilmarkörer | Rader, filter, kort, tomläge, popup, knapphierarki |
| Ekonomi/Städning/Rutiner/NPF | Egna lokala layoutmönster och äldre stilar | Färg- och typografikonsistens utan att tappa funktion |
| Familj/Profil/Relationer | Delvis gemensam presentation | Gemensamma rubrikroller, sekretess, textzoom |

### Djupare kontroll före åtgärd
`studies.tsx`, `flowstudy.tsx`, `workflow.tsx`, `life-profile.tsx`, `planning.tsx`, `overview.tsx`, `admin.tsx`, `admin-stats.tsx`. De har få/inga explicita Pace-designmarkörer i sidfilerna; granska deras importerade komponenter och faktiska vyer innan stiländring. Admin ska ha egen informationstäthet och behöver inte se identisk ut med användarens app.

## Komponentfynd
- `src/components/myflove/block.tsx` är befintligt gemensamt kortmönster, men namnet är legacy. **Byt inte API eller sparade kollapsnycklar** bara för designen.
- `src/components/paceable/design-system.tsx` har PacePage/PaceCard/PaceBlock m.fl. som bör vara den publika designvägen.
- `src/components/notebook/notebook.css` har en egen färgpalett och många stilregler: mappa dess tokens till journal-tokens, men behåll papperskänslan.
- `src/components/calendar/calendar-planner.tsx` har många lokala kortstilar: identifiera återkommande mönster och byt varsamt till gemensamma klasser.
- `src/components/layout.tsx` är över 1100 rader: central layout/nav kan ge bred påverkan; testa i alla huvudflikar.
- `src/app-typography.css` har en central typografihierarki som PR #82 uppdaterar. Kontrollera CSS-specificitet och befintliga NPF-inställningar.

## Föreslagen implementeringsordning
1. **Testa PR #82**: build, mobilbredd, 200 % text, mörkt läge, tangentbord, familjeperspektiv. Justera eventuella regressionsfel innan merge.
2. **Gemensamma komponenter**: samordna kort/sektion/knapp och notebook-färgtokens i liten separat PR, utan breda CSS-överskrivningar.
3. **Kalender + barn**: komponentvis redesign med visuella före/efter-kontroller.
4. **Mer + undersidor**: kartlägg och uppdatera återstående lokala mönster i små PR:ar.
5. **Full regressionsrunda**: fem huvudflikar, mörkt läge, NPF, offline/nativ, familjeintegritet och sparad data.

Inget i detta dokument betyder att någon sida är visuellt godkänd; det kräver en riktig renderad kontroll.
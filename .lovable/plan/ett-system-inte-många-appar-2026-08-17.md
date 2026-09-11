# Ett system, inte många appar

Analys först: nästan allt som behövs finns redan. Uppgifter har livsområde, datum, tid, steg och friktionsdata. Livspusslet samlar redan signaler från uppgifter, energi, humör, schema och barnens dag. FlowScore räknar redan kapacitet. Det som saknas är att informationen _rör sig_ konsekvent mellan delarna – och att språket ser likadant ut överallt.

Nedan är förslaget, i tre steg. Jag bygger steg 1 först och visar innan jag går vidare.

## Vad som redan finns (och kan kopplas utan ombyggnad)

- `Task` bär redan `area`, `dueDate`, `time`, `steps`, `courseId` — men uppgifter skapade i Studier/Jobb/Barn syns inte alltid i Min dag och FlowScore på samma sätt.
- `useLifePuzzle` samlar redan uppgifter, lektioner, barnens händelser, energi, humör och tankar — men används bara av hemskärmen och Flow.
- Friktionsbiblioteket har redan `matchFriction` som gissar tyngd — men används bara i WorkFlow/StudyFlow.
- Quickflow gissar redan livsområde — men tanken blir sällan en riktig uppgift med tid och nästa steg.

## Steg 1 – En gemensam "livsobjekt-vy" (bygger jag först)

**Ett gemensamt kort.** En `<FlowItemCard />` i designsystemet som visar samma fem saker överallt: livsområde (färgprick), när (tid/deadline), prioritet, energibehov (friktion från biblioteket) och nästa steg. Används i Min dag, Uppgifter, StudyFlow, WorkFlow och Quickflow-listan — samma sak ser likadan ut oavsett var man är.

**Deadlines når alltid dagen.** En delad selektor (`src/lib/flow-items.ts`) som samlar allt tidssatt från uppgifter, lektioner, barnens schema och rutiner till en lista. Min dag, Hem och FlowScore läser från samma källa, så en skoluppgift med deadline påverkar automatiskt planering och rekommendationer.

**Energibehov överallt.** `matchFriction` körs på alla uppgifter, inte bara jobb/studier, så "tung/lätt just nu" blir ett generellt språk.

## Steg 2 – Flow som intelligent lager

- Låg FlowScore filtrerar aktivt vad Flow och Min dag rekommenderar, med ett tydligt "vi förenklar idag"-läge och ett-knapps omplanering av resten.
- Flow-svaren får samma livsobjekt-kort som resten av appen, så förslag går att agera på direkt.
- Quickflow som universell ingång: efter inmatning föreslår Flow område, tid, prioritet och nästa steg — användaren behöver bara godkänna.

## Steg 3 – Mönster och lärande

- Friktionsbiblioteket sammanställer återkommande mönster ("morgonärenden känns tyngst") och ger personliga strategier som går att slå på direkt.
- Reflektionen (Flow Reset) matar tillbaka till nästa dags kapacitet, som redan finns, men blir synlig som "därför ser dagen ut så här".

## Teknik

Ingen ny arkitektur och inga nya menyval. Nya filer: `src/lib/flow-items.ts` (delad selektor) och `src/components/myflove/flow-item-card.tsx`. Befintliga hooks (`use-life-puzzle`, `use-flowscore`, `use-data`) läses av selektorn utan ändrad datamodell. Ingen databasmigrering krävs. CHANGELOG.md och `src/lib/changelog.ts` uppdateras.

# Family Flow möter Mitt batteri och Flow

Målet: barnens schema ska kunna bidra till bilden av hur krävande dagen är – utan ett nytt batteri, utan påhittade energikostnader och utan dubbletter i Min dag.

## Vad som byggs

### 1. "Kräver mig"-information på familjeaktiviteter
En aktivitet i barnens schema kan få frivillig information:
- Jag behöver vara med
- Förberedelse (5/10/15 min)
- Resa/hämtning (5/10/15/20 min)
- Lugn stund efteråt

Ingen aktivitet får ett energivärde. Informationen sparas i samma aktivitet som redan finns – inga nya listor, inga nya tabeller.

### 2. Tydligt men lugnt i schemat
I Vecka och Idag visas en diskret markering "Kräver dig" med text, inte bara färg. Nu/Nästa förblir lugnt: bild, kort text och en liten färgmarkör.

### 3. Flow ser helheten
Flow väger redan in batteri, kalender, Min dag och QuickFlow. Nu läggs dagens familjeåtaganden till som en sammanfattning, till exempel: "Du har 38 % batteri, jobb till 16:00 och två familjeaktiviteter efter det." Flow föreslår enklare kväll och återhämtning – aldrig automatisk ombokning.

### 4. Återhämtning som faktiskt får plats
Den befintliga funktionen som hittar luckor räknar nu med förberedelse och restid runt varje familjeaktivitet, och prioriterar en lucka direkt efter en aktivitet som är markerad med "lugn stund efteråt". Bara aktiviteter som kräver förälderns närvaro räknas som fasta hållpunkter för föräldern. Förslagen använder Mikropaus, Ljusboost, Akut Lugn och Stopp precis som idag, och läggs in först när användaren säger ja.

### 5. Efteråt: hur påverkade det dig?
Den befintliga frågan (Gav energi / Tog energi / Både och / Vet inte) används även när en familjeaktivitet bockas av. Inget nytt loggsystem.

### 6. Försiktiga mönster
Över tid kan Flow säga saker som "Du har tidigare loggat att eftermiddagar med flera familjeaktiviteter ofta tar mycket energi" – formulerat som användarens egna loggar, aldrig som en generell sanning och aldrig om barnet.

### 7. Inga dubbletter
Barnens aktiviteter visas redan i Min dag via samma gemensamma lista. Den kopplingen behålls som den är; barnets namn syns fortfarande så man ser vem det gäller.

## Tekniska detaljer

- `src/lib/child-visual-schedule.ts`: `VisualActivityMeta` utökas med valfria `parentPresence`, `prepMinutes`, `travelMinutes`, `recoveryAfter`. Kodas/avkodas i befintligt metadata-kuvert med validering; äldre aktiviteter förblir giltiga.
- `src/components/family/visual-child-schedule.tsx`: nytt kompakt fält "Kräver mig" i redigeringsformuläret samt diskret badge i Vecka/Idag.
- `src/hooks/use-child-events.ts`: `ChildEvent` får med avkodad involvering (`requiresParent`, `prepMinutes`, `travelMinutes`, `recoveryAfter`, `endTime`).
- `src/lib/recovery-gaps.ts`: `FixedSlot` får `prepMinutes`, `travelMinutes`, `preferAfter`; buffert beräknas per hållpunkt i stället för globalt, och en lucka direkt efter `preferAfter` rankas först.
- `src/hooks/use-recovery-gaps.ts`: familjehållpunkter filtreras på `requiresParent` och skickar med prep/resa.
- Ny ren logik `src/lib/family-load.ts` + `src/hooks/use-family-load.ts`: sammanfattar dagens familjeåtaganden (antal, tidsfönster, hur tätt det ligger) och en försiktig mönstermening baserad på befintlig aktivitetshistorik. Ingen ny lagring.
- `src/hooks/use-flow-personal-context.ts`: lägger till familjesammanfattningen i Flows kontext.
- `src/pages/family-flow.tsx`: litet kort "Vad kräver dig idag?" med länk vidare till Flow; befintligt återhämtningskort behålls.
- Avbockning av barnaktiviteter skickar befintlig `ACTIVITY_DONE_EVENT` så "Hur kändes det?" visas (verifieras och kompletteras vid behov).

## Test

Enhetstester för `family-load.ts` och utökade tester för `recovery-gaps.ts`: låg/medel/hög kapacitet, flera familjeaktiviteter samma dag, med och utan krav på närvaro, luckor på 10/15/20/30/45 minuter, förberedelse/restid, samt att inget skapas utan ja. Därefter typecheck, hela testsviten, build och kontroll i mobil 360/375/390/430 och desktop utan overflow. CHANGELOG.md, src/lib/changelog.ts och roadmap.md uppdateras.

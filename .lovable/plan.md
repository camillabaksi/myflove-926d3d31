# Uppgifter – samma godkända Paceable-uttryck

## Granskning
Skärmbilden visar den befintliga Uppgifter-sidan, inte en ny målbild. Sidans färger har redan fått delar av Paceable-stilen, men egna äldre text- och kontrollstilar finns kvar: stora och tunga uppgiftsnamn, kraftiga kapselflikar, täta versalrubriker och en inramad överdel. Den gemensamma ytan räcker därför inte för ett sammanhållet uttryck.

## Avgränsad visuell justering
| Del | Justering | Återanvändning |
| --- | --- | --- |
| Överdel | Lugn, oinramad sidrubrik med mer balanserad luft; befintlig rubrik och beskrivning behålls. Fraunces endast på sidans orienterande huvudrubrik. | Befintlig editorialroll och Paceable-ytor. |
| Lägg till och områdesval | Samma innehåll och placering, lugnare visuell vikt. Områdesfärger fortsätter identifiera respektive område. | Befintliga kontroller, ikoner och formulär. |
| Idag / Kommande / Klart | Ett lättare sammanhållet vyval med diskret lavendelmarkering och plommontext, i stället för stora separata färgkapslar. Antal och beteende behålls. | Befintliga knappkomponenter och färgvärden. |
| Gruppnamn | Inter, lättläst storlek, normal bokstavsform och luft utan utdragen bokstavsbredd. Samma ord, utfällning och hjälpinnehåll. | Befintlig gruppkomponent med sidlokala stilval. |
| Uppgiftskort | Befintlig varm kortyta, tunn kant, mjuk rundning och diskret djup. Uppgiftsnamn i Inter cirka 18–20 px vid normal textstorlek, vikt 500–600; inte Fraunces. Balanserade avstånd mellan namn, metadata och åtgärder. | Befintliga kort- och textvärden; ingen ny kortfamilj. |
| Ändra, klara och uppskjutna uppgifter | Samma visuella familj, naturlig radbrytning och tydliga kontroller. Alla befintliga fält, tider, statusar, delsteg och åtgärder behålls. | Nuvarande visning och händelsehantering. |

## Skydd
- Endast Uppgifter ändrar utseende. Idag, Kalender, Tankar, Min plats, Mer, Hem och Flow lämnas oförändrade.
- Ingen ändring av sparning, sortering, filtrering, återkommande uppgifter, avbockning, radering, kalenderkoppling, familj, konto, behörigheter, notiser eller Capacity/Load/Pace.
- Befintliga texter bevaras bortsett från visuell bokstavsform på gruppnamn. Ingen ny hjälpcopy eller funktion.
- Logotyp, godkända stenar, illustrationer och navigation är orörda. Ingen ny bild behövs.
- Inga paket, globala rubrikändringar, nya färgsystem eller publicering.

## Teknisk avgränsning
- `src/pages/tasks.tsx`: sidlokala presentationsklasser, typografiska roller och befintliga designknappar; händelsehantering bevaras.
- `src/styles.css`: regler under en uttrycklig Uppgifter-avgränsning som återanvänder befintliga Paceable-tokens. Ingen ändring av globala fontmappningar.
- `TaskQuickAdd`, `CollapsibleSection` och `AreaSwitcher` återanvänds med befintliga klass-/rubrikval. Om dialogen behöver egen presentation används endast ett uttryckligt opt-in i `src/components/task-quick-add.tsx`; övriga användningar får inte påverkas.
- Dokumentation i `CHANGELOG.md`, `src/lib/changelog.ts`, `roadmap.md` och en sidavgränsningsregel i `AGENTS.md` efter genomförandet.

## Verifiering före leverans
- 360/390/430/1024/1440 px, ljust och mörkt, normal och 200 % text: långa uppgiftsnamn bryts utan ellips, minskning av förstorad text, överlappning eller sidledsöverflöde.
- Minst 44 × 44 px klickyta för uppgiftskontroller, synligt fokus och kontrast enligt WCAG AA.
- Kontroll av alla tre vyval, områdesfilter, gruppöppning, Ändra och Lägg till-dialog med tangentbord/Escape. Ingen testuppgift sparas i användarens konto.
- Befintliga tester och riktade isolerade kontroller för uppgiftsåtgärder; hela sviten och automatiskt bygge. Före-/efterbilder av Uppgifter och kontroll av oförändrade primärsidor.

Genomförandet inväntar ditt godkännande. Publicering kräver separat godkännande.
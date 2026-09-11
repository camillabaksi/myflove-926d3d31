# Förenkla aktivitetsflödet i Kalendern

## Mål

Göra Kalenderns dagvy till en tydlig fortsättning på den förenklade aktivitetsmodellen: först synliggörs det användaren faktiskt gjort, därefter visas tidsbestämda saker och övriga kalenderhändelser. Behåll befintlig Task/Event/FlowItem-data och undvik en parallell lagringsmodell.

## Bekräftat nuläge

- `/idag`, `/kalender` och `/lagg-till` går via `DayHub` med gemensamma dagflöden.
- `TaskQuickAdd` är den förenklade vägen för "Jag gjorde detta" och "Jag ska göra detta", med valt datum, frivillig tid, `completed` och separat `completedAt`.
- `useFlowItems` filtrerar daterade aktiviteter på sitt eget datum och låter inte avklarning flytta dem till dagens datum.
- Kalendern har redan en `AllInDay`-vy som delar upp data i gjorda utan tid, öppna utan tid och tidsatta saker, men dagsvyn har samtidigt kvar en äldre generell "Ny händelse"-dialog och en separat tidslinjepresentation.

## Genomförande

1. **Gör Kalenderns dagvy konsekvent**
   - Låt den primära dagpresentationen tydligt visa sektionerna "Det här gjorde du" och "Tider" för valt datum.
   - Behåll kalenderhändelser, barnhändelser, påminnelser och återkommande poster som visuellt sekundära kalenderposter; blanda inte ihop dem med användarens faktiska aktivitetslista.
   - Återanvänd `useFlowItems`, `FlowItemCard`, `DayTimeline` och befintliga designkomponenter så status och avcheckning fortsätter vara gemensam.
   - Säkerställ tomlägen och räknare för datum utan gjorda aktiviteter respektive utan tider.

2. **Förenkla vägen att lägga till från Kalendern**
   - Gör den gemensamma Lägg till-vägen till det tydliga primära valet även från ett valt kalenderdatum, med datumet förvalt.
   - Behåll bara specialiserade kalenderflöden där de behövs för påminnelser/familje- eller barnhändelser, men skilj dem visuellt från vanlig aktivitet och använd begriplig användarterminologi.
   - Ta inte bort befintlig kalenderfunktionalitet som krävs för tider, återkommande poster eller familjedata.

3. **Täta datum- och dubblettkanterna**
   - Kontrollera och korrigera `useFlowItems`/semantikhjälpare så datumlösa och daterade aktiviteter inte inkluderas på fel dag.
   - Kontrollera att QuickFlow-bryggan, hydration/sync och kalenderns listor återanvänder stabila ID:n och inte renderar samma aktivitet två gånger.
   - Verifiera att markering som klar aldrig ändrar `dueDate`; `completedAt` ska endast användas för datumlösa poster.

4. **Dokumentation och verifiering**
   - Uppdatera `roadmap.md`, `CHANGELOG.md` och `src/lib/changelog.ts` med en enda städad post för förändringen.
   - Kör befintliga tester, lint, typecheck och production build.
   - Verifiera scenariot: gjort aktivitet 25 augusti, planerad aktivitet 4 september, möte 3 september 09:00; kontrollera Kalender/Idag, reload, navigation och synk utan dubbletter.
   - Kontrollera även mobil och desktop i körande preview samt att inga nya konsol- eller runtimefel uppstår.

## Tekniskt

- Endast befintliga klientkomponenter, hooks och semantikhjälpare ändras; ingen ny databasmodell och ingen ny backendfunktion.
- Alla nya interaktiva kontroller använder befintliga design-systemkomponenter där sådana finns.
- Behåll Clerk-auth, TanStack-routing och befintlig MyFlove-palett/typografi.

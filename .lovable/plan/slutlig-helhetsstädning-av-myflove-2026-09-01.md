# Slutlig helhetsstädning av MyFlove

## Mål
Konsolidera befintlig funktionalitet till en sammanhållen app utan nya produktfunktioner, dataförlust eller borttagna legacy-routes.

## Genomförande
1. **Flow och navigation**
   - Göra `/flow` till den tydliga huvudingången med Hjälp, Planera och Chatta med Flow.
   - Behålla `/flowplan`, `/assistant` och äldre routes som kompatibilitetsroutes, men ta bort nya interna redirectkedjor och konkurrerande CTA-mål.
   - Presentera Idag/Kalender/Lägg till som en gemensam Min dag-upplevelse med befintliga routes kvar där de behövs.

2. **QuickFlow och Idag**
   - Kontrollera befintliga PriorityTasks/Tasks och behålla kompatibilitetslagret.
   - Säkerställa att den kanoniska uppgiften och dess id är source of truth, att spegling är idempotent och att dubbelrendering inte sker.
   - Behålla QuickFlow utan krav på tid och låta kalendern endast innehålla planerade tider/påminnelser.

3. **Gemensamt visuellt system**
   - Migrera medication, routines, finances, reminders och flow-settings till MyFloveHeader + MyFloveBlock/MyFloveBlockGrid/MyFlovePageGrid.
   - Verifiera usage innan dead code tas bort; ta endast bort `overwhelmed-modal.tsx` om den är oanvänd.
   - Standardisera tokens, spacing, shadows, grids och mobilanpassning utan att ändra fungerande beteende eller användarvalda färger.

4. **Modals, sheets och mobil**
   - Säkerställa gemensam maxhöjd, intern scroll, safe-area och horisontell overflow-hantering för Dialog, Sheet, BottomSheet, Modal och Popover.
   - QA vid 360, 375, 390 och 430 px med särskilt fokus på bottennavigation, CTA:er och textbrytning.

5. **Analytics och energilogik**
   - Låta nya statistikpunkter gå via central `track()` och behålla historiska eventnamn där bakåtkompatibilitet kräver det.
   - Dokumentera och tydliggöra energy_logs som källa för tidsstämplade observationer, energy_factors som påverkansfaktorer och lokal data som cache, utan energimigrering.

6. **Verifiering och dokumentation**
   - Manuell route-/CTA-kontroll, riktade dataflödestester och kontroll av logout/login-bevarande.
   - Köra lint, typecheck, alla tester och production build.
   - Uppdatera `CHANGELOG.md` och `src/lib/changelog.ts` med exakt genomförda ändringar. Legacy-routes, användardata och befintliga produktregler lämnas kvar.

## Säkerhetsregler
- Ingen big-bang-migrering eller radering av befintliga poster.
- Alla kompatibilitets-/synksteg ska vara idempotenta och behålla gamla data vid fel.
- Osäkra flöden behåller kompatibilitetslagret tills de är verifierade.
- Inga nya produktfunktioner introduceras.

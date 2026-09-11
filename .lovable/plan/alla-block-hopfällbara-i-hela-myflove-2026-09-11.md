# Alla block hopfällbara i hela MyFlove

## Mål

Alla större innehållsblock på appens inloggade sidor ska kunna minimeras och öppnas igen. Varje blocks val ska sparas lokalt på den aktuella enheten och återställas när användaren återkommer.

## Genomförande

- Gör MyFloves gemensamma blocktyp hopfällbar som standard, så befintliga block på exempelvis rutiner, medicin, ekonomi, Flow och inställningar får samma beteende automatiskt.
- Uppdatera expanderbara block så deras öppna/stängda läge sparas per sida och block, i stället för att alltid återställas.
- Byt större specialbyggda innehållskort på återstående sidor till det befintliga hopfällbara mönstret, bland annat profil, vecköversikt, ”Hur mår du?”, appöversikt och hemskärmsinställningar.
- Behåll rubriker och viktig status synlig i minimerat läge; innehåll, formulär och detaljlistor döljs utan att data eller funktioner påverkas.
- Undanta sidrubriker, navigation, dialogrutor, enskilda listposter och rena åtgärdsknappar eftersom de inte är innehållsblock.
- Säkerställ stabila unika block-id:n per sida så två block med liknande namn inte delar sparat läge.
- Uppdatera båda ändringsloggarna enligt projektets rutin.

## Teknisk kontroll

- Lägg till eller uppdatera tester för sparat öppet/stängt läge och blockens standardbeteende.
- Kör formattering, TypeScript-kontroll, riktade tester och projektets build.
- Kontrollera visuellt i mobilbredd 411 px och desktop att block kan fällas ihop, öppnas och behåller läget efter sidladdning.

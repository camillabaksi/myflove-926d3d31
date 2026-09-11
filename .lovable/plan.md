# Enklare MyFlove för personer med NPF

Målet: samma design, samma funktioner – men färre saker på skärmen samtidigt, en sak i taget, och ett tydligt förstahandsval för den som vill ha det lugnt. Ingen ny visuell design, inga borttagna funktioner.

## Vad som gör appen rörig idag

- Hem visar många block i rad: hero, Flow-kort, tre steg, nästa steg, kvällscheck, "Mer i MyFlove" med widgets, batteri, Idag, rutiner, insikter m.m.
- Mascoten rör sig (`flow-alive`) och det finns animationer även för den som inte valt "Ingen rörelse".
- NPF-läget finns under Anpassa, men det är svårt att hitta och påverkar inte vad som visas – mest hur det ser ut.
- Förstagångsanvändare möter allt på en gång (introduktion + alla block).

## Förslag – tre lager av förenkling

### 1. "Enkelt läge" direkt på Hem
- En lugn, tydlig knapp högst upp: "Vill du ha det enklare? Visa mindre på skärmen" som slår på det befintliga NPF-läget med ett tryck (färre saker + lugnare färger + ingen rörelse + enkla ord).
- Samma knapp finns kvar under Anpassa – inget nytt system byggs.

### 2. Låt "Färre saker" faktiskt gömma saker
- CSS-stödet finns redan: `html[data-npf-less="true"] [data-npf="optional"] { display: none }`.
- Märk upp sekundära block (t.ex. mascotrörelser, dekorativa bubblor, extra widgets, veckomönster, adaptiva förklaringar) med `data-npf="optional"` så de försvinner när enkelt läge är på.
- Kärnflödet (Hur mår du? → Vad händer? → Behöver du planera om?) syns alltid.

### 3. Lugnare första intryck
- Nya användare möter bara steg 1 (Hur mår du?) – övriga block ligger hopfällda som standard tills användaren öppnat dem en gång.
- Mascoten blir stilla för den som valt "Ingen rörelse" (redan stöd i CSS – kopplas till animationen).

## Utanför förslaget (ändras inte)
- Design, färger, typsnitt, kortstil.
- Alla funktioner, data och navigation.
- Analytics och datainsamling.

## Verifiering
- Testa enkelt läge på/av på mobil 360–430 px och desktop.
- Lint, typecheck, tester, build.
- Uppdatera CHANGELOG.md + src/lib/changelog.ts.

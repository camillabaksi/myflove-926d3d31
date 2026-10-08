# Paceable — taktilt djup och visuell dimension

Endast presentation. Ingen ändring av Capacity/Load/Pace, kalender-, familje- eller completion-logik, data, routes, lagring, identifierare. Ingen publicering. Mockupen är riktning, inte funktionell mall: inga framtida Capacity-procent.

## 1. Får material/elevation
- **Capacity-ytan på Idag**: varm off-white yta, hårfin varm kant, elevation-1, mycket svag ljusvariation; spåret lätt nedsänkt (inner shadow). Färg konstant, horisontell, ingen ring.
- **Primär knapp (plum)**: svag ljus överkant, kort mjuk skugga, sjunker 1 px vid tryck, lugn tydlig fokusring.
- **Sekundära knappar/chips**: off-white + tunn varm kant, nästan ingen skugga.
- **Dagens Pace**: sage-yta kvar, varm kant + elevation-1. Ingen ikon, gradient eller celebration.
- **Kalender, vald dag**: tunn plum-kontur, mjukt tonad yta, extremt svag separation. Geometri, prickar och indikatorer oförändrade.
- **Dialoger/sheets**: elevation-2, systemets enda tydliga lyft.

## 2. Förblir platta
Aktivitetsrader på Idag (whitespace, tunna avdelare, lätt hover/pressed-ton, 44 px-mål kvar, lugnt klart-läge), sektionsrubriker, metadata, datumrader, övriga kalenderdagar, tidslinjen, bottennavigeringen (aktiv flik: lavender-wash + plum, mjuk övergång, ingen skugga), Tankar- och Min plats-innehåll (endast delade tokens/knappar).

## 3. Stenarna: ballong till taktil pebble
- En högupplöst transparent bild (minst 3x visningsstorlek) med exakt tre stenar i fast ordning: låg, bred, mjukt asymmetrisk lavendel; varmare, rundare, kuddig aprikos; högre, tyngre salvia. Matt keramik/mineral, ljus från övre vänster, liten lokal kontaktskugga, svag ambient skugga emellan, ingen glans, glow eller genomskinlighet.
- `PaceableStones` behåller sitt API; komponenten lägger till en mycket svag `--pace-contact-shadow` så den sitter mot olika ytor.
- Valfri settling (opacity + 2 px, kort ease-out) vid första render; helt statisk vid reduced motion.
- **Befintliga förekomster** (rapporteras innan de byts): Idag-hälsningen, Tankar-sidan (`/quickflow`), Dagens Pace-modulen och sidomenyn på desktop. Förslag: endast Idag får den nya bilden i denna etapp; de andra tre behåller nuvarande SVG tills du har bedömt stenarna på Idag. Inga nya placeringar.

## 4. Typografi, riktning C
- Två jämförelsebilder bifogas (A Fraunces, B Newsreader), identiska förutom rubriktypsnitt: hälsning 42 px, rubriker 24 px, vikt 500.
- Editorial font endast för hälsning och viktiga sektionsrubriker på `/idag`, `/kalender`, `/quickflow`, `/halsa`. Inter kvar för allt övrigt (body 400, titlar 500–600, metadata 400 muted, labels 600).
- Inget slutligt fontval implementeras förrän du valt A eller B.

## 5. Tokens (`src/styles.css`, med dark mode)
`--pace-canvas`, `--pace-surface`, `--pace-surface-raised`, `--pace-border-warm`, `--pace-elevation-0/1/2`, `--pace-contact-shadow`, `--pace-highlight-top`, `--pace-inset-track`, `--font-editorial`. Inga per-komponent-skuggor; ingen höjd mättnad.

## 6. Risk för legacy-sidor
- Alla nya roller kopplas till befintlig Paceable-ytmarkering, så legacy-sidor påverkas inte.
- Risk: den delade knappkomponenten används även på legacy-sidor. Taktil knappstil läggs därför endast inom Paceable-ytorna, inte i grundkomponenten.
- Risk: appens toppfält ("Paceable") använder samma rubriknivå; i jämförelsebilderna fick den också serif. Vid implementation avgör vi om toppfältet ska följa med eller förbli Inter (förslag: förbli Inter).
- Dialoger renderas utanför sidytan; elevation-2 läggs därför på Paceable-dialogernas egna klasser, inte globalt.

## Efter fontval och implementation
Testsvit, typkontroll, bygge; de fyra vyerna på 360/390 px och desktop (overflow, textskalning, kontrast, fokus, 44 px, ljust/mörkt, reduced motion, skarpa små stenar, inga framtida Capacity-värden, Core/familj/read-only oförändrat). AGENTS.md och changelogs uppdateras. Fem screenshots, nr 5 som verklig app-rendering av stenarna. Inga ändringar efter screenshots före din granskning. Ingen publicering.

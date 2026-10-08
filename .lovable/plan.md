# Paceable — taktilt djup och visuell dimension

Endast presentation. Ingen ändring av Capacity/Load/Pace, kalender-, familje- eller completion-logik, data, routes, lagring, identifierare eller publicering. Bilden används som riktning, inte mall (inga procent i framtida kalenderdagar, ingen ny funktion).

## 1. Får material/elevation
- **Capacity-ytan på Idag**: varm off-white surface, hårfin varm kant, elevation-1, spåret lätt nedsänkt (inner shadow). Färgen förblir konstant.
- **Primär knapp (plum)**: tunn ljus överkant, kort mjuk skugga, sjunker 1 px vid tryck, tydlig fokusring.
- **Sekundära knappar/chips**: off-white + tunn kant, nästan ingen skugga.
- **Dagens Pace**: behåller sage-ytan, får subtil varm kant + elevation-1. Ingen ikon, ingen gradient.
- **Kalender, vald dag**: tunn plum-kontur + mycket mjuk tonad yta + extremt svag skugga. Geometri, prickar och kapacitetsindikatorer oförändrade.
- **Dialoger/sheets**: elevation-2 (den enda flytande nivån).

## 2. Förblir medvetet platta
- Aktivitetsraderna (endast whitespace, tunna avdelare, lätt hover/pressed-ton; inga kort).
- Sektionsrubriker, metadata, datumrader.
- Bottennavigeringen: samma ikoner, aktiv flik = mjuk lavender-wash + plum, mjuk färgövergång, ingen skugga.
- Kalendergriddens övriga dagar, tidslinjen.
- Tankar- och Min plats-sidornas innehåll utöver delade knapp-/ytroller.

## 3. Stenarna: från ballonger till taktila pebbles
- En enda genererad bild (transparent PNG) med tre matta keramik-/mineralstenar: låg asymmetrisk lavendel, varmare rundare aprikos, högre tyngre salvia. Ljus från övre vänster, kontaktskugga under, svag ambient skugga mellan, ingen glans.
- `PaceableStones` behåller sitt API men renderar denna bild överallt (samma modell, inga nya former per vy). Nuvarande SVG-blobbar tas bort.
- Används på Idag vid hälsningen (liten) och i befintliga placeringar där de redan finns; inga nya placeringar.
- Valfri mycket kort "settling" vid första render (opacity + 2 px), avstängd vid reduced motion. Ingen idle/puls.

## 4. Typografi, riktning C
- **Display/hälsning och sektionsrubriker på primärytorna**: mjuk editorial serif (förslag: Fraunces med låg "softness"/opsz, alternativt Newsreader), vikt 500–600, inte fet.
- Hälsning cirka 40–44 px mobil, sektionsrubriker cirka 22–24 px.
- **Body/UI/metadata/labels**: Inter, oförändrade, med tydligare viktskillnad (titel 500–600, metadata 400 muted, labels små versaler 600).
- Begränsas till primärytorna (`/idag`, `/kalender`, `/quickflow`, `/halsa`) via befintlig Paceable-ytmarkering; legacy-sidor påverkas inte.
- Notera: detta ersätter tidigare regel "sans-serif på core-vyer" för rubriker. Brödtext förblir sans-serif.

## 5. Tokens (i `src/styles.css`, med dark-mode-motsvarigheter)
- `--pace-canvas`, `--pace-surface`, `--pace-surface-raised`, `--pace-border-warm`
- `--pace-elevation-0` (ingen), `--pace-elevation-1` (mycket subtil), `--pace-elevation-2` (flytande, sparsamt)
- `--pace-contact-shadow` (endast stenar), `--pace-highlight-top` (ljus överkant), `--pace-inset-track` (nedsänkt spår)
- `--font-editorial` + typografiska utilities för display/rubrik/metadata/label
- Små justeringar av befintliga plum-/lavender-/sage-värden endast i ton, inte mättnad.

## Verifiering efteråt
Testsvit, typkontroll, bygge; `/idag`, `/kalender`, `/quickflow`, `/halsa` på 360/390 px och desktop: overflow, textskalning, kontrast, fokus, 44 px-mål, ljust/mörkt, reduced motion, små stenar. Sedan fem screenshots (Idag övre, aktivitetsrader + Pace, Kalender månad, Kalender dag, närbild stenar) och inga fler ändringar före din granskning. Changelogs och AGENTS.md uppdateras. Ingen publicering.

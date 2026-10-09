# Hälsa & välmående – samma målbild som Kalender, Fånga och Min plats

## Omfattning
Endast sidorna Mitt batteri (`/mitt-batteri`), Återhämtning (`/aterhamtning`), Mående och Energikarta. Idag, Kalender, Fånga, Min plats, Mer och navigationen lämnas oförändrade. Ingen publicering.

## Vad som ändras (endast utseende)
- Sidrubriker: samma lugna Fraunces-rubrik i djup plommon (`.pace-next-title`) som Min plats; beskrivningar i Inter.
- Knappar, val och filter på sidorna: samma kompakta kontroller (visuellt ca 32–38 px, minst 44 × 44 px tryckyta, ikoner 16–18 px) och mörklila markering för aktivt val.
- Kort: samma rundning, tunna kant och lugna mellanrum som Min plats; större ingångskort behåller sina ikoner och beskrivningar.
- Mörkt tema använder de redan testade ljusa plommonvarianterna.

## Skydd
Ingen ändring av mätningar, energi-/mående-loggar, Capacity, Din takt, pausens timer/tysta läge, diagramfärger, statusfärger, områdesfärger, sparning, synk, notiser, routes eller data. Paus-helskärmen och formulärens sparknappar behåller sitt nuvarande utseende. Inga nya paket, inga globala stiländringar, originalbilder orörda.

## Tekniskt
- Opt-in genom att lägga `pace-next-page` på respektive sidas `MyFlovePageGrid`, samt `pace-next-title`/`pace-compact-control` på rubriker och sidans egna kontroller.
- Filer: `src/pages/battery.tsx`, `src/pages/pause.tsx` (Återhämtning), `src/pages/mood.tsx`, `src/pages/energy-map.tsx`; vid behov små tillägg under `.pace-next-page` i `src/styles.css`.
- Dokumentation: `CHANGELOG.md`, `src/lib/changelog.ts`, `roadmap.md`.

## Verifiering
360/390/430 px och desktop, ljust/mörkt, normal/200 % text: ingen sidscrollning, inga mål under 44 px. Öppna befintliga formulär utan att spara testdata. Hela testsviten. Mobilbilder i ljust och mörkt tema levereras som filer.

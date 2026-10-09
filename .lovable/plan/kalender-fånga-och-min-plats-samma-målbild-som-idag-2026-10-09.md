# Kalender, Fånga och Min plats – samma målbild som Idag

## Godkänt och nästa avgränsning
Etapp 2–3 på Idag är godkänd. Nästa etapp omfattar endast Kalender, Fånga och Min plats. Mer, navigationen och Idags logotyp/hälsning behålls. Ingen publicering.

Kontrollerna får ett något kompaktare uttryck. Plommon ska upplevas tydligare mörklila/mörkröd, inte nästan svart. Föreslagen ton är djup plommon, cirka `#4F2753`; värdet är ett förslag, inte ett tidigare godkänt färgvärde. Originalens logotyper och stenar färgas aldrig om.

## Genomförandeordning
1. **Kalender:** anpassa Lägg till, Månad/Vecka/Dag, Familj, kategorifilter och sekundära verktyg till samma kontrollerade skala som Idag. Bevara periodpilar med minst 44 × 44 px. Kalenderns befintliga familjeval används – ingen ny personväljare eller ändrat perspektivsystem.
2. **Fånga:** kompaktare befintliga text-/röstkontroller och ingångarna Bild och PDF/dokument. Huvudrubriken behåller Fraunces; funktionella texter Inter. Befintlig inmatning, granskning, import, sparning och stenplacering är oförändrade.
3. **Min plats:** enhetlig huvudrubrik och varsamt samordnade mellanrum/ikonmått. De stora länkkorten behåller läsbara beskrivningar, områdesfärger och tillräckligt utrymme; de ska inte krympas till filterknappar. Inga personfilter läggs till där de saknas.

## Gemensamma mått och färg
- Åtgärder cirka 34–36 px synligt, kompakta val cirka 32 px; minst 44 × 44 px effektiv tryckyta och separerade träffytor.
- Ikoner normalt 16–18 px i kontroller; större ingångskort behåller sina större ikoner.
- Text får brytas och kontroller växa vid 200 % text. Ingen kapning av viktiga namn eller etiketter.
- Återanvänd befintliga Pace-mönster med uttrycklig opt-in. Den globala basknappen ändras inte.
- Den föreslagna mörkare plommonkaraktären begränsas till markerade åtgärder, aktiva val och orienterande text på de tre sidorna. Ingen global ändring av foreground/primary/ink, diagram-, status- eller områdesfärger. Mörkt tema behåller läsbara ljusa text-/kontrollvarianter.

## Filer och påverkan
| Fil | Avgränsad ändring |
|---|---|
| `src/components/calendar/calendar-planner.tsx` | Endast namngivna huvudkontroller och filter, inte tidsblock eller dialogformulär |
| `src/pages/calendar.tsx` | Befintliga verktyg: snabbtillägg, påminnelse, kopiera och bildstöd; endast presentation |
| `src/pages/dump.tsx` | Lokal avgränsning och rubrik-/avståndsregler |
| `src/components/quickflow-capture.tsx` | Opt-in presentation av befintliga kontroller |
| `src/components/quickflow-image-import.tsx` | Opt-in för importingångar, inte importdialogens handlingar |
| `src/pages/health.tsx` | Lokal rubrik och ingångspresentation |
| `src/components/paceable/design-system.tsx`, `src/styles.css` | Endast vid behov: gemensamma opt-in-klasser och lokala färgroller |
| Relevanta tester, `AGENTS.md`, `CHANGELOG.md`, `src/lib/changelog.ts`, `roadmap.md` | Regressioner och redovisning |

Delade capture-/importkontroller kan användas på andra sidor; standardpresentationen bevaras där. `PersonSwitcher` och Idag ändras inte ytterligare i denna etapp. Ingen synlig ändring av den dubbla Min dag-etiketten ingår.

## Skydd
Ingen ändring av innehållsordning, funktioner, aktiviteter, avcheckning, formulärens sparning/utkast, användardata, synk, behörigheter, notiser, Capacity, Din takt, familjens datalogik, routes, native-projekt eller beroenden. Kalenderns cellmått, tidsaxlar, dagbredder, NU-linje, drag/drop och Ångra lämnas orörda. Mobilens kompakta kapacitetsstöd och Veckans mål bevaras.

## Verifiering och leverans
- Ta före-/efterbilder på mobil i ljust och mörkt tema för alla tre sidorna.
- Kontrollera 360/390/430 px och desktop, normal/200 % text, tangentbordsfokus, kontrast och minst 44 px effektiva tryckytor.
- Prova kalendervybyte, periodval, filter och öppning av familjeval/tillägg utan att spara testdata.
- Prova Fångas befintliga kontroller och importöppning; kontrollera Min plats-länkar och expansion.
- Kör relevanta regressionstester och hela befintliga testsviten; kontrollera automatiskt bygge och jämför Idag/Mer för oavsiktliga förändringar.
- Redovisa ändrade filer, bilder, testresultat och eventuella begränsningar. Stanna efter denna etapp.

**Genomförandet av de tre nya sidorna startar efter godkännande av denna avgränsning. Ingenting publiceras.**
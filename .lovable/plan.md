# Mer: flytta de fyra sektionerna in under befintliga överkategorier

## Mål
Ta bort de fyra fristående sektionerna längre ner på Mer och placera deras innehåll som hopfällbara underkategorier under relevanta befintliga överkategorier. Visuell design, rutter, behörigheter och funktioner oförändrade.

## Föreslagen hierarki (exakt)

- **Min profil** (oförändrat huvudkort) + Inställningar-länk
- **MIN VARDAG**
  - Befintliga kort kvar: Uppgifter, Ekonomi, Studier, Arbete
  - Nytt hopfällbart kort: **Min dag** → Idag, Kalender, Tankar, Påminnelser, Timer
  - Nytt hopfällbart kort: **Hem och vardag** → Matlista, Inköpslista, Städning
- **HÄLSA & VÄLMÅENDE**
  - Befintligt kort kvar: Träning och rörelse
  - Nytt hopfällbart kort: **Ork och återhämtning** → Min plats, Mitt batteri, Energins historik, Återhämtning, Stop-paus, Rutiner & medicin
- **STÖD & SAMTAL** (ny överkategori)
  - Hopfällbart kort: **Flow och samtal** → Flow, Prata med Flow, Planera, Anteckningar
- **FAMILJ & RELATIONER** — oförändrat (Familj-kort)
- **ÖVERBLICK & INSIKTER** — oförändrat (Insikter och historik-kort)
- **FLER VERKTYG** — oförändrat: Fler funktioner behåller ALLA grupper (inkl. de fyra), Äldre funktioner kvar med Äldre Hem
- Avslutande påminnelsefält — oförändrat

## Beteende
- Samma befintliga expanderbara `card()`-komponent och styling som Familj/Insikter/de fyra sektionerna redan använder — ingen ny variant.
- Hopfällda från början, flera kan vara öppna samtidigt (befintlig `open: string[]`-logik).
- Behörighets- och Enkelt läge-filter gäller per länk via befintliga `visible()`; en underkategori som blir tom renderas inte, men överkategorin och övriga kort finns kvar.
- Genvägar får finnas på flera platser (avsiktligt); inga dubbletter inom samma underkategori.

## Ändrade filer
- `src/components/paceable/more-view.tsx` — omplacering av de fyra grupperna till underkategorikort i respektive sektion; inga nya komponenter eller stilar.
- `src/components/paceable/more-view.test.tsx` — uppdatera tester: underkategorierna är hopfällda från början, expanderar och visar rätt destinationer, filter gäller på båda platserna, inga dubbletter inom samma underkategori.
- `CHANGELOG.md`, `src/lib/changelog.ts` — dokumentation.

## Skydd
Inga ändringar av rutter, behörigheter, sökning, Enkelt läge, datalagring, andra sidor eller globala stilar. Inga nya paket.

## Verifiering
Hela testsviten, bygge, samt webbläsarkontroll: mobil/desktop, ljust/mörkt läge, 200 % text, sökning, Enkelt läge och behörighetsfilter. Ingen publicering före uttryckligt godkännande.

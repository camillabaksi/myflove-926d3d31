# QuickFlow → Fånga: synligt namnbyte (steg 2)

## Mål
Användaren ska se funktionen som **Fånga** – "Få ur dig det. Ta hand om det sen." Endast synliga texter byts. Alla interna namn (komponenter, hooks, lagringsnycklar, routes, analytics) behålls oförändrade.

## Avgränsning (skydd)
- Inga ändringar av: interna identifierare (`QuickflowCapture`, `useQuickflow`, `myflove-quickflow` m.fl.), routes (`/quickflow`), lagring/synk/kryptering, påminnelser/notiser, behörigheter, Pace/Din takt/Capacity, familj, native.
- Inga nya beroenden, ingen publicering.
- Befintlig funktion och användardata rörs inte.

## Ändringar (endast synliga texter)

| Yta | Idag | Nytt |
|---|---|---|
| Meny/navigation | Tankar | **Fånga** (godkänt) |
| Sidans rubrik/knuttexter | "Vad har du i huvudet?", "Fånga en tanke" | Behålls/anpassas till Fånga-språk |
| Hjälp- och tom-lägen-texter | "QuickFlow", "Quickflow" | "Fånga" |
| Sorterings-/prioritets texter | "Flow sorterar", "Behåll i Quickflow" | "Pace sorterar" / "Behåll i Fånga" |
| Toastar | "...tillbaka i QuickFlow" | "...tillbaka i Fånga" |
| Engelska översättningar | "Quickflow" | "Capture" |
| Sidmetadata (titel/og) | "Quickflow – få ut det ur huvudet" | "Fånga – få ut det ur huvudet" |

## Tekniskt upplägg
1. Uppdatera `src/lib/i18n-dicts/quickflow.ts` (sv + en) – de flesta synliga texterna ligger där.
2. Riktade textbyten i `src/pages/dump.tsx`, `src/components/quickflow-*.tsx`, `src/routes/_app.quickflow.tsx` (head-metadata).
3. Menyetikett i navigationen (om "Tankar" → "Fånga" godkänns).
4. Uppdatera testet `src/lib/pace-brand-copy.test.ts` och ev. quickflow-tester som matchar texter.
5. CHANGELOG.md + src/lib/changelog.ts enligt rutin.

## Test
- Hela testsviten (528+ tester), build.
- Playwright: /quickflow på 360/390/1280 px, ljust/mörkt, 200 % text; kontroll att fångst, påminnelse och sortering fungerar som före.

## Fråga innan genomförande
Menyn heter idag "Tankar". Ska den byta till "Fånga", eller behållas "Tankar" medan funktionen inne på sidan heter Fånga?

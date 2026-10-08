# Tankar — "Varför?" in i importkortets nederkant

Endast en presentationsändring: den befintliga "Varför?"-länken på Tankar flyttas in i importkortet "Importera till kalendern", vänsterställd under knapparna Bild och PDF / dokument. Ingen publicering.

## Läge
- `QuickflowImageImport` är delad: den renderas fristående på Tankar (`src/pages/dump.tsx`) och inuti `QuickflowCapture` på legacy-ytor (endast när textrutan är tom). Därför görs flytten med ett **valfritt prop** som är avstängt som standard — legacy-ytorna renderas oförändrade.
- `WhyHint` återanvänds med befintlig `appearance="inline"`-variant (Inter, muted, infoikon, min 44×44 px klickyta, fokusring). Ingen ny komponent, ingen ny funktion.

## Ändringar
1. `src/components/quickflow-image-import.tsx`:
   - Nytt valfritt prop `whySlot?: ReactNode` på kortets props.
   - I importkortet, efter knapp-raden (Bild / PDF / dokument): `<div className="mt-3">{whySlot}</div>` — vänsterställd, inne i samma kortyta, med luft ovanför så det inte ser ut som en tredje knapp.
   - Ingen ändring av importlogik, filhantering, dialog eller knappbeteende; övriga anropare (utan prop) påverkas inte.
2. `src/pages/dump.tsx`:
   - Ta bort den fristående `WhyHint`-raden under `<QuickflowImageImport />` och skicka i stället samma `WhyHint label="quickflow" appearance="inline"` (oförändrat innehåll och text "Varför?") som `whySlot` till `<QuickflowImageImport whySlot={...} />`.
   - Runtan runt import och Varför förenklas så att inget tomt mellanrum blir kvar.
3. Inga andra filer ändras. Stenar, rubriker, tankeinfångningsyta, knappar, typografi, tokens, funktion, data och routes orörda.

## Verifiering
- Playwright: `/quickflow` vid 360/390/430 px och desktop — Varför-länken inne i kortet under knapparna, minst 44×44 px klickyta, tangentbordsfokus fungerar, popover öppnar samma innehåll, ingen horisontell overflow, light/dark mode.
- Kontrollsumma för stenasseten oförändrad; övre Tankar-region pixeljämförd för stenar och tankeinfångning.
- Kör befintliga tester (bunx vitest run) och kontrollera build-loggen.
- Uppdatera CHANGELOG.md, `src/lib/changelog.ts` och roadmap.md.

## Leverans
- Tre bilder: Tankar 390 px, närbild av importkortet med Varför, desktop Tankar.
- Bekräfta: endast Varför flyttades, funktionen oförändrad, stenarna oförändrade, inga andra visuella ändringar. Ingen publicering.

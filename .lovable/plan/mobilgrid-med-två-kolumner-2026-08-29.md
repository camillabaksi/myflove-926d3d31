# Mobilgrid med två kolumner

## Ändring

- Ändra det gemensamma block- och sidrutnätet till två kolumner som standard även på 320–412 px.
- Behåll fullbredd endast för rubriker, formulär, grafer, tidslinjer och andra block som faktiskt behöver bredd.
- Anpassa Hem, Hälsa och Mitt batteri så små och medelstora block blir riktiga gridobjekt sida vid sida på mobil.
- Minska endast mobil padding/gap där det behövs för läsbarhet; ingen funktion, data eller navigation ändras.

## Teknisk kontroll

- CSS Grid använder `grid-cols-2` med `minmax(0, 1fr)` och `min-w-0`; större skärmar får 3–4 kolumner.
- Verifiera 320, 360, 375, 390 och 412 px med rendering och overflow-kontroll.
- Kontrollera textbrytning, knappar, ikoner och blockstorlek samt kör lint, typkontroll, tester och production build.
- Uppdatera projektets två changelog-filer enligt befintlig rutin.

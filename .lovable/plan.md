# Visuellt barnschema 1.0 i Family Flow

## Mål
Bygga vidare på befintliga barnprofiler, barnaktiviteter och skolschema så att föräldern kan se och ändra barnets vecka, dagens ordning samt ett enkelt Nu/Nästa-läge. Ingen ny barnapp, kalender eller uppgiftsmodell skapas.

## Det som byggs
1. **Schema inne i Family Flow**
   - Varje barnkort får knappen **Schema**.
   - Schemat öppnas på Familj-sidan med lägena **Vecka** och **Idag**.
   - Mobil visar en kompakt staplad vecka utan sidleds-scroll; desktop visar sju tydliga dagkolumner.

2. **En gemensam aktivitetskälla**
   - Återanvänd `child_items` för nya, daterade aktiviteter och befintligt veckoschema för återkommande skoltider.
   - Samma barnaktiviteter fortsätter visas i Min dag och kalenderflödet via den befintliga kopplingen.
   - Dubblettkontroll på barn, datum, tid och normaliserad titel innan en aktivitet skapas eller en vecka kopieras.

3. **Idag och fokusläge**
   - Dagens aktiviteter sorteras i ordning och grupperas lugnt efter del av dagen.
   - Klart, Nu, Nästa och senare får tydliga visuella tillstånd.
   - **Klar** använder befintlig avcheckning och energicheck-in; fokus flyttas automatiskt till nästa aktivitet.

4. **Aktivitetsbank och egna aktiviteter**
   - Kompakta, expanderbara kategorier för Hemma, Skola, Transport, Fritid och Återhämtning.
   - Egen aktivitet får namn, ikon, valfri tid, färg och kategori.
   - Visuell metadata sparas tillsammans med den befintliga barnaktiviteten, inte i ett nytt aktivitetsregister.

5. **Egna privata bilder**
   - Kamera eller bildväljare använder den befintliga privata `child-docs`-lagringen.
   - Bilder öppnas via tidsbegränsade signerade länkar och kopplas via befintligt `file_path`; inga publika bildadresser skapas.

6. **Redigering och kopiera vecka**
   - Befintliga barnaktiviteter kan ändras eller tas bort direkt i schemat.
   - **Kopiera vecka** kopierar aktuella daterade aktiviteter sju dagar framåt efter bekräftelse och hoppar över dubbletter.

7. **Family Flow-koppling**
   - Förälderns befintliga FlowScore används för låg/medel/hög kapacitet och neutral fallback.
   - Ett tätt schema kan ge ett frivilligt förenklings- eller återhämtningsförslag; inget flyttas eller tas bort automatiskt.
   - Barnets sparade preferens för förvarning ger en enkel övergångstext inför nästa aktivitet utan separat uppgift.
   - Relevanta öppna QuickFlow-poster som nämner barnet kan läggas in som vanliga barnaktiviteter och tas då bort ur inkorgen för att undvika dubbletter.

## Säkerhet och avgränsning
- Befintlig inloggning, ägarbaserad åtkomst och privata barnlagring återanvänds.
- Ingen barninformation läggs i publik metadata eller analytics.
- Ingen diagnos, medicinsk rådgivning, offentlig delning eller betalvägg byggs.
- Bottennavigation och vanliga användarflöden ändras inte.

## Verifiering
- Enhetstester för veckodatum, sortering, dubbletter, fokusförflyttning samt kapacitets-, övergångs- och återhämtningsförslag.
- Flödestest av skapa/redigera/klar/kopiera/bild/QuickFlow med inloggad användare utan att lämna testdata kvar.
- Kontroll på 360, 375, 390 och 430 px samt desktop, inklusive sidleds-scroll.
- Kör TypeScript-kontroll, hela testsuiten och appbygget.
- Uppdatera båda ändringsloggarna med datum 2026-09-23.

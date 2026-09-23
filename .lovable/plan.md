# Family Flow: pictogram och flexibel kopiering

## Mål
Förbättra det befintliga barnschemat utan att ändra Family Flow-strukturen eller skapa ett nytt schemasystem. Emoji och stjärnor ersätts av tydliga pictogram med svensk text. Samma privata `child_items` fortsätter vara källa för schema, Min dag och kalender.

## Det som byggs
1. **Pictogram med kommersiellt tillåten licens**
   - Använd Lucide-ikoner som grund för ett sammanhållet, neutralt pictogrambibliotek. Lucide har ISC-licens och tillåter kommersiell användning.
   - Skapa en barnanpassad pictogramkomponent med konsekvent linjetjocklek, tydlig kontrast och stabil storlek.
   - Dokumentera källa och licens i projektets dokumentation.
   - Befintliga emoji-värden läses bakåtkompatibelt och mappas till motsvarande pictogram; ingen sparad aktivitet försvinner.

2. **Snabb pictogramväljare**
   - `Lägg till aktivitet` får sökfält, kompakta kategorier och visuella val med kort svensk text.
   - Kategorier: Hemma, Skola, Mat, Hygien, Transport, Fritid, Träning, Återhämtning och Familj.
   - Pictogram är standard. Egen privat bild ligger kvar som ett tydligt alternativ.

3. **Kopiera aktivitet och dag**
   - Aktivitetens meny får `Kopiera till…` med idag, imorgon eller valfritt datum.
   - Varje dag i veckovyn får en kompakt meny för att kopiera hela dagen till imorgon, ett datum eller flera valda dagar.
   - Originalet ändras aldrig. Exakta dubbletter hoppas över.

4. **Kopiera vecka**
   - Veckomenyn stödjer nästa vecka eller en annan vald vecka och visar bekräftelse före kopiering.
   - Datumförskjutningen bevarar veckostrukturen, tiderna och pictogrammen.

5. **Kopiera mellan barn**
   - Om flera barn finns kan aktivitet, dag eller vecka kopieras till ett annat befintligt barn.
   - Kopior blir separata `child_items`; senare ändringar påverkar inte originalet.
   - Titel, tid, kategori, färg och pictogram följer med. Privata anteckningar och barnets profilpreferenser kopieras inte automatiskt.
   - Egna bilder dupliceras privat när det är möjligt så två aktiviteter inte delar en fil som kan raderas från den andra.

6. **Enkla mallar**
   - En dag kan sparas som en namngiven mall, exempelvis Morgonrutin eller Skoldag.
   - Mallar sparar aktiviteternas neutrala schemafält, inte privata anteckningar eller barnprofilens preferenser.
   - `Lägg till mall` skapar vanliga barnaktiviteter för valt datum med samma dubblettskydd.

7. **Nu/Nästa och befintliga flöden**
   - Nu/Nästa, Klar, automatisk fokusflytt, egna bilder, QuickFlow, kalender och energicheck-in behålls.
   - Barnets huvudvy visar pictogram plus kort text; inga långa instruktioner läggs där.

## Teknisk lösning
- Utöka den befintliga visuella metadatan i `notes` med en stabil `pictogram`-nyckel och bakåtkompatibel migrering från gamla emoji-värden.
- Lägg pictogramkatalog, sök, datumförskjutning och kopieringsplanering i rena hjälpfunktioner med enhetstester.
- Återanvänd `addItem`, `updateItem`, privata `child-docs` och befintlig molnsynkad lagring. Mallar är återanvändbara val, inte ett parallellt aktivitetsregister.
- Alla kopieringsoperationer bygger en dubblettnyckel av barn, datum, tid och normaliserad titel innan något skapas.
- Dela upp den stora schemakomponenten i fokuserade pictogram- och kopieringsdelar utan att ändra sidans övergripande layout.

## Verifiering
- Enhetstester för gammal metadata, pictogrammappning, sök/kategorier, datum- och veckoförskjutning, privata anteckningar och dubblettskydd.
- Flödestest för skapa, egen bild, aktivitet/dag/vecka, flera dagar, annat barn, mall och Nu/Nästa.
- Kontrollera att original och mål är oberoende och att kalendern inte får dubbla poster.
- Kontroll på 360, 375, 390 och 430 px samt desktop utan horisontell overflow.
- Kör TypeScript-kontroll, hela testsuiten och appbygget.
- Uppdatera båda ändringsloggarna med datum 2026-09-23.

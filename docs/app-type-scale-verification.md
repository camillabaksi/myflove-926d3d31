# Enhetlig normalstorlek – kontroll 2026-10-20

## Genomfört
- Delad rem-skala för appens sidor, undervyer och portaler: sidrubrik 24 px, sektionsrubrik 18 px, kortrubrik 16 px, lästext/aktivitet 15 px, kontroll/hjälp 14 px och metadata 12 px vid normal grundstorlek.
- Formulärtext 16 px; anteckningsbokens handstil har separat läsbar storlek. Batterisiffror, tidsgeometri och logotyp behåller sina egna roller.
- Gemensamma kommandon har minst 44 × 44 px träffyta med mindre synlig yta. Mer luft-inställningen behåller större träffytor.
- Ingen ändring av data, periodbetydelser, lagring, synk, språkval, auth eller publicering.

## Verifierat
- Inloggad webbläsarkontroll av 67 statiska appadresser inklusive befintliga redirects, vid 320/360/390/411/430/768/1280/1600 px, ljust/mörkt och grundstorlek 16/18,5/32 px: 3 216 kombinationer utan dokumentoverflow eller JavaScript-fel. Synliga h1/h2/h3 följde rollskalan; uppmätta gemensamma kommandon understeg inte 44 px.
- Efterbilder för Idag, Pace, Insikter och Beslut på mobil/dator och större text finns i `/tmp/browser/type-scale/final-*.png`. Formulärbilder och lokal jämförelse finns i samma mapp.
- Planera: osparad aktivitet granskad och självvald 08:30 läst tillbaka. Kalender: befintligt tilläggsformulär öppnat, 08:30 läst tillbaka och stängt utan sparning. Logga energi & mående öppnades och stängdes utan sparning.
- Befintlig större-textregel gav 18,5 px grundstorlek och 27,75 px sidrubrik utan att spara inställningar. Inställningsavsnittet är hopfällt som standard; själva reglageflödet verifierades inte genom att ändra kontot.
- 54 riktade tester i nio filer passerade, inklusive två regler för bibehållna större-text/mer-luft-val. Automatiska previewbygget rapporterade build OK 13:42:36 UTC.

## Begränsningar
- Kontroll av statiska adresser är inte verifiering av alla interna tillstånd, dynamiska chatt-ID:n, adminbehörigheter eller dolda dialoger. Ingen ny chatt skickades eller kontodata sparades.
- Två äldre anteckningsbokstester misslyckas på saknade tidigare kontrollnamn (`Osäkert än` och `Bokdel`); 64 av 66 tester passerade i den bredare körningen. Anteckningsbokskomponenterna ändrades inte för att tysta dessa tester.
- Ingen fysisk telefon, full kontrast/WCAG-granskning eller verklig sparning/synk verifierad.
- Förebilden rekonstruerades enbart i webbläsaren genom äldre typografiregler och är inte en äkta före-kodändring-skärmbild. Den kan även skilja sig i tidigare gemensam presentation och ska inte användas som exakt regressionsbevis.
- Inget publicerat.
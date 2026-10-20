# Mobilkontroller och tidsrader – 2026-10-20

## Genomförande
- Befintliga kompakta sidlayouter, Kalender, Planera och dagstöd optas in till mindre synliga knappytor på mobil under 768 px. Minst 44 px tryckytor, oförändrad textstorlek och växande höjd vid radbrytning.
- Portalled kalenderdialoger optas in separat. Tidsfält och längdval behåller utkast och befintliga sparfunktioner.
- Tidslinjens mobilskala är 1,35 px/minut mot oförändrade 1,7 på desktop. Samlade koordinathjälpare styr timlinjer, block, familjekontext, NU och drag/flytt.
- Visuellt minimiutrymme och kollisionshantering anpassas till mobilskalan/textförstoring utan att ändra faktiska tider eller anta varaktighet. Veckovyn visar en läsbar kolumn på mobil, med intern horisontell scroll.
- Ingen data-, lagrings-, auth-, native- eller publiceringsändring. Mer/Pace-speciallayouter och anteckningsbokens papper orörda.

## Verifiering
- Före-/efterbilder för Kalender, Planera och Uppgifter vid 360/390/430/768/1280/1600 px i `/tmp/browser/mobile-controls/`.
- 120 inloggade layoutkontroller: fem sidor × sex bredder × två teman × normal/32 px rottext. Ingen dokumentoverflow och inga pageerrors. Samtliga mätta mobilkontroller minst 44×44 px. Desktopkalenderns sex äldre smala kontroller lämnas oförändrade.
- Kalenderns registreringsdialog: 08:30 och 30 minuter valda, dialog scrollad och stängd med Escape utan sparning. Planeringslista granskad med ett osparat exempel och start/slut 08:30–09:00; värden lästes tillbaka genom formuläret, ingen sparning.
- Riktade tester täcker skalor, drop-inversion, aktuelltidsmarkör, korta aktiviteters gruppöppning, sena familjeaktiviteter, manuella rutin-/paustider, utkast och befintlig batchsparning i mockad testmiljö.
- Desktopens tidslinjehöjd för samma laddade period oförändrad 1648 px. Mobilens jämförbara laddade period 1312 px, cirka 20 % kortare. En tidig 360 px-bild hade ofullständigt laddad period och används inte för höjdjämförelse.

## Begränsningar
- Klassväxling av mörkt tema i en session med äldre personliga temaval visar befintliga kontrastbrister i skalet/kalenderytor; denna kontroll är inte en full WCAG-granskning och inga globala färger ändras här.
- Stor text ger bredare kalenderkolumner som sveps inom kalendern; alla kolumner visas inte samtidigt. Långa aktivitetsrubriker kan fortsatt behöva öppnas för att läsas helt.
- Förebilder på Kalender visar delvis laddat underlag; ingen full pixeljämförelse av kontodata görs. Före-/efter på Planera är direkt jämförbara.
- Fysisk telefon, OS-textförstoring, skärmläsare samt verklig sparning/flytt/synk på isolerat konto är inte verifierade. Inga testskrivningar gjordes i användarens privata konto.
- Ingen publicering.
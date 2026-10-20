# Kompakt layout på återstående appdelar – 2026-10-20

## Genomfört
- 36 sekundärsidor optas in till gemensamma rubriker och/eller sektionsavstånd. Befintliga innehållsdelar, handlingar och datakällor behålls.
- Rubriker/avstånd: Inställningar, Profil, Anteckningar, Min plats, Pace-inställningar, Påminnelser, Rutiner, Inköpslista, Medicin, Städning, Ekonomi, Jobb, Energiflöde, Stopp, Uppgifter, Barn, Relationer, Pomodoro, Statistik, Feedback, Rutiner & medicin, Veckans översikt, Dagens balans, Anpassa, Familjeflöde, Träning, Familj, Mående, Energikarta, Studier, Matlista, Belöningar, Pitch, Admin och Adminstatistik. Insikter får endast tätare yttre sektionsavstånd och behåller sin tidigare rubrik och diagram.
- Uppgifter, Inköpslista och Admin behåller befintliga val och får gemensam opt-in valstil. Specialval för personer, delning, timers och träningspass behåller sina betydelser.
- Desktop-sidomenyn begränsas till 288 px. Vid förstorat textläge på 768–1100 px används befintliga mobilnavigationen; textstorleken minskas inte.
- Mörklägets gemensamma rubrik och Min plats-länkar använder läsbar texttoken inom kompakta sidor.
- Pace, Mer, Idag, Kalender och reflektionsboken får ingen sidlokal omdesign. Delat appskal påverkar navigering även där.

## Verifierat
- Automatisk byggkontroll: build OK, senaste avlästa 2026-10-20T12:33:40Z.
- 27/27 riktade tester i nio filer: uppgifter, träning, adminplattformar, Pace-inställningar, sidrubrik, blockpresentation, planeringsutkast och Insikter. Uppgifternas äldre mock kompletterad med redan befintlig useReminders; produktlogik oförändrad.
- Inloggad webbläsare: 31 adresser × 360/390/430/768/1280/1600 px × två teman × 16/32 px rottext = 744 mätningar. Ingen horisontell dokumentoverflow och inga pageerrors.
- Pitch och Adminstatistik hann inte visa rubrik i några tidiga mätningar; senare kombinationer visade innehåll. Dessa initiala laddningslägen är inte fullständigt verifierade som läsbara innehållsvyer.
- Visuellt granskade representativa skärmbilder för Träning mobil, Uppgifter desktop och Min plats surfplatta med stor text. Min plats har användbar bredd och läsbara mörka länkar; sidomenyn visas inte vid 768 px/32 px text.
- Verklig inloggad interaktion: Uppgifter Kommande/Klart, Inköpslista personlig/delad vy, Träning program/översikt samt påminnelseformulär öppnat, fyllt och stängt med Escape. Ingen spar-/avbockningsknapp användes. Befintlig automatiskt driven kontosynk var inte spärrad.
- Metadata granskad på innehållsrutter, inklusive index: nödvändiga fält finns; inga metadataändringar gjorda.

## Begränsningar
- Förebildsfångsten misslyckades med inloggning; tillförlitlig före/efter-jämförelse saknas.
- 744 overflowmätningar är inte en fullständig visuell WCAG-/kontrastgranskning av varje formulär, diagram och betydelsebärande färg. Personlig färgpalett i kombination med manuellt simulerat mörkläge kan ge äldre kontrastfel utanför rubrikrättningen.
- Mående, Energikarta, Rutiner, Medicin och Veckans översikt är även inbäddade/omdirigerade innehållsdelar; separat direktadress kunde inte alltid testas. Den gemensamma Rutiner & medicin-vyn och Veckans flow-adressen kontrollerades.
- Fysisk mobil, verklig OS-textförstoring, skärmläsare och ny sparning/molnsynk har inte testats i denna presentationsetapp.
- Inga paket, auth-, databas-, lagrings-, native- eller domänändringar. Ingen publicering.

Skärmbilder och kontrollskript finns i `/tmp/browser/compact-remaining/`.
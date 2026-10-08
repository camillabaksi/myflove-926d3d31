# Tankar – två avgränsade presentationsändringar

## Tankeinfångningen
Endast på Tankar: ersätt den stora streckade ramen med befintlig varm Paceable-yta, tunn neutral kant och subtil elevation-1. Behåll radie, ikon, texthierarki, texter och hela klickytan. Ingen gradient eller ny animation. Övriga användningar av tankeinfångningen lämnas orörda.

## Varför?
Behåll samma hjälp och innehåll, direkt efter importdelen. Visa hjälpen som en diskret inline-länk utan pillram, med befintlig muted-färg, Inter och infoikon. Minst 44×44 px klickyta och tydligt tangentbordsfokus. Ändringen gäller bara Tankars hjälplänk.

## Oförändrat
Stenarnas asset, rendering, storlek och position, sidrubrik, toppfält, navigation, importknappar och allt övrigt innehåll lämnas exakt som nu. Ingen ändring av logik, parser, röst, data, lagring eller routes. Ingen publicering.

## Verifiering och leverans
- Spara stenbildens kontrollsumma och mät stenarnas position/storlek före och efter.
- Kontrollera 360/390/430 px och desktop, light/dark, 200 % textskalning, fokus, touchyta och overflow.
- Öppna befintlig tankeinfångning och samma hjälp; kontrollera import- och röstkontroller utan att spara kontodata. Faktisk mikrofoninspelning och import till kalendern redovisas som ej fullständigt testade om de inte kan kontrolleras utan kontoändringar.
- Kör befintliga tester och uppdatera båda ändringsloggarna.
- Leverera endast fyra bilder: Tankar övre 390 px, närbild av tankeinfångningen, import med Varför, desktop Tankar. Redovisa exakta presentationsändringar och bekräfta oförändrade stenar; inga visuella ändringar efter bilderna.

## Tekniska detaljer
Avgränsa utseendet med en frivillig presentationsvariant för capture och hjälplänken, aktiverad endast från Tankar. Återanvänd befintliga semantiska yta-/kant-/elevationtokens; ändra inga gemensamma grundstilar.
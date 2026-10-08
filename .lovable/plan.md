# Paceable — typografisk hierarki före visuellt lås

## Avgränsning
Endast typsnittsroller, storlek och vikt justeras. Stenbilden, dess rendering på 126 × 74 px och placeringen vid hälsningen lämnas exakt orörda. Färg, ytor, skuggor, innehållsordning, navigation och alla funktioner/data/Core-regler bevaras. Ingen publicering.

## Idag
- **Serif:** hälsningen behåller Fraunces, vikt 500 och naturlig nuvarande radbrytning, med mobilstorlek inom 36–38 px. ”Din dag” får uttrycklig editorialroll, 24–26 px och vikt 500.
- **Inter:** Capacity-label 600; ”Hur börjar du dagen?” 600 och 22–24 px; brödtext 400; knapp 500–600. Ingen annan kortdesign ändras.
- ”Tider idag” och ”Övrigt idag” blir funktionella Inter-rubriker, 600 och 18–20 px på Idag. Aktivitetsinformation och Dagens Pace använder Inter; funktioner, 44 px-kontroller och klarmarkeringar bevaras.

## Övriga primärytor
- Tankar: endast den huvudsakliga orienterande rubriken får editorialroll. Import, resultat, instruktioner och övrig funktionell information använder Inter.
- Min plats: endast ”Min plats” får editorialroll. Funktionella rubriker som ”Mitt batteri”, ”Återhämtning” och ”Mer inom hälsa” använder Inter.
- Kalender: rubrik, periodnamn och övriga kalendertexter är funktionell sans-serif. Ingen ändring av geometri, kontroller eller data.

## Tekniskt genomförande
- Ersätt den befintliga breda Fraunces-regeln för `h1/h2.font-display` inom Paceable med en uttrycklig `.pace-editorial`-roll. Ändra inte globala heading-stilar eller fontinläsning.
- Använd befintlig Inter-token för funktionella roller. Delade komponentändringar begränsas till Idag/berörda primärytor så att legacy-konsumenter behåller sin presentation.
- Varken PaceableStones-komponenten eller dess bildfil ändras; verifiera bildens kontrollsumma före/efter.
- Dokumentera i AGENTS.md och båda changelogs.

## Kontroll och leverans
- Idag vid 360, 390, 430 px och desktop: långt namn, stenar/text utan överlapp, rubrikhierarki, aktivitetslista, navigation och ingen sidscroll.
- Kontrollera 200 % textskalning, light/dark och synliga fokuslägen; stenar får inte flyttas för att lösa typografi.
- Kontrollera Kalender, Tankar och Min plats för oavsiktliga effekter. Kör befintlig testsvit och tillgängliga automatiska kontroller; inga manuella produktionsbyggen.
- Leverera fem skärmbilder: Idag övre 390 px; Capacity + Din dag; Tider idag + aktivitetsrader; Tankar; Min plats. Redovisa exakt kvarvarande serifroller och bekräfta oförändrad stenasset.
- Inga ytterligare visuella ändringar efter skärmbilderna före granskning. Ingen publicering.
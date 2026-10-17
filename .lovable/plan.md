# Kalendern – etapp 2: lugnare månadsvy

## Resultat
- Månadsvyn får en diskret **månadssammanfattning**: antal planerade aktiviteter i månaden, hur många dagar som har innehåll och hur många dagar som är tomma. Ärlig och kvalitativ — ingen belastningsprognos för framtiden, inga antagna lediga tider.
- Varje månadsruta visar **antal aktiviteter** som en liten siffra bredvid områdesprickarna (och i skärmläsartexten), så man ser dagens tyngd utan att öppna dagen.
- Den valda dagens sektion under månadsrätten blir en **kompakt lista** enligt samma princip som Idag: kronologisk ordning, tid bara där den finns, klara poster dämpade med befintlig klarmarkering. Familjeraden och bildstöd fungerar som idag.

## Genomförande
- Ändra endast `src/components/calendar/calendar-planner.tsx` (månadsdelen) och vid behov isolerade presentationstester.
- Månadssammanfattningen byggs av befintliga `planningDays` och befintliga hjälpare; okänt visas som "Inte uppskattad", aldrig som noll.
- Rutsiffran återanvänder befintliga `days`-data; ingen ny beräkning utöver räkning.
- Den valda dagens lista återanvänder befintlig `blockButton`-rendering och befintlig sortering; ingen ny datakälla, ingen ändring av avbockning.
- Behåll kapacitetssiffran i rutorna, områdesprickar, bildstöd, familjelager, drag-och-släpp och alla övriga kontroller orörda.

## Teknisk kontroll
- Inga data-, lagrings-, behörighets- eller routsändringar; inga nya paket.
- Kör relevanta tester, typkontroll och automatiskt bygge.
- Kontrollera 360, 375, 390, 430 och 1280 px, ljust/mörkt läge och 100/200 % text utan horisontell overflow.
- Uppdatera CHANGELOG.md, src/lib/changelog.ts och roadmap.md med dagens datum.
- Ingen publicering.

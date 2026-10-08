# Paceable — slutlig polish före visuellt lås

## Endast tre ändringar
- Ersätt äldre stenillustrationer i befintliga placeringar med exakt samma godkända transparenta bild, proportionellt med `object-fit: contain`. Inga nya stenar, platser, färger, effekter eller bildändringar.
- Idags hälsning: Fraunces 500, cirka 32–34 px på smal mobil och 36–38 px på större mobil. Naturlig namnbrytning, utan hårdkodade namn. Stenarnas 126×74 px, placering och befintliga rendering lämnas orörda.
- Min plats: Fraunces 500, 30–32 px mobil och något större avstånd mellan hjärtikonen och rubriken. Allt annat på sidan bevaras.

## Inventering
- Idag: godkänd bild, 126×74 px; ingen stenändring.
- Tankar (`/quickflow`): äldre kompakt SVG uppe till höger; ersätt i samma placering med bilden.
- Desktop/sidebar: äldre SVG i en 64 px bred placering; ersätt endast bilden på Paceables primärytor, behåll storleken och rapportera läsbarheten som granskningspunkt.
- Dagens Pace: endast en oanvänd import hittades, ingen renderad stenplacering. Lägg inte till någon.
- Kalender och Min plats: inga egna stenplaceringar hittades. Lägg inte till några.

## Tekniskt genomförande
- Behåll PaceableStones API och legacy-renderingen utanför primärytorna. Använd bildvarianten i de befintliga primärplaceringarna. Skydda Idags godkända rendering och bildfil med kontrollsummor.
- Använd avgränsade typografiroller och fasta responsiva storleksnivåer; inga globala rubrikändringar. Avståndet vid Min plats ändras endast i dess header, inte hos legacy-konsumenter.
- Behåll befintlig kort settling och statiskt reduced-motion; inga extra bildfilter eller skuggor i de nya bildplaceringarna.
- Uppdatera presentationstester, AGENTS.md och båda changelogs. Ingen ändring av Core, familj, completion, parser, navigation, routes, auth, lagring, data eller identifierare.

## Kontroll och leverans
- Idag 360/390/430 px och desktop, korta/långa namn utan sparning, oförändrad stenstorlek och ingen överlappning.
- Tankar 360/390 px och desktop, Min plats 360/390 px; kontrollera textskalning 200 %, light/dark, reduced-motion, fokus och overflow.
- Kör full testsvit och läs automatiska byggkontroller. Separat typkontroll rapporteras inte som godkänd om den inte faktiskt verifierats.
- Bekräfta bildens kontrollsumma före/efter. Redovisa ersatta och kvarvarande gamla stenillustrationer, storlekar och begränsningar.
- Visa fem app-renderade bilder: Idag 360, Idag 390, Tankar 390, Min plats 390 och sten-närbild/jämförelse. Därefter inga visuella ändringar före granskning. Ingen publicering.
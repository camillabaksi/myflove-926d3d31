# Paceable – rökslingor och ren telefonkant

## Undersökningen
- Den redigerbara v5-källan finns: `ads/videos/paceable_bubbles_v5_source/render_v5.py`. Arbetet kan göras i en kopia av den befintliga animationen; ingen nygenererad film eller uppskattning av banor behövs.
- Upplösningen styrs av `draw_bubble`, `make_vapor`, `vapor_pos` och `smoke_layer`. Nuvarande effekt summerar 460 små mjuka partiklar per bubbla med suddig halo. Partiklarna har dessutom olika slutpunkter inom kategorin. Det förklarar den breda puffen i stället för tydliga slingor till en gemensam punkt.
- Telefonens gränssnitt perspektivplaceras med `quad`/`warp` och klipps med `screen_mask`/`screen_xy_clip`; glasreflexen använder samma mask.
- Den rektangulära kanten finns redan i öppningsbilden och den rena bakgrundsbilden. Båda visar också en extra tunn telefonkontur ovanför ramen. Den ursprungliga referensbilden saknar dessa fel. `prepare` lägger dessutom in referensbildens telefon med en hård polygon, vilket behöver avgränsas till den fysiska telefonen. En faktiskt renderad v5-slutbild bekräftar att kanten kvarstår. Detta är alltså inte bara en felaktig skärmmask.
- Filen `1000123213.mp4` finns inte bland de tillgängliga uppladdningarna. Jämförelsen görs därför mot sparad v5 och dess redigerbara källa; identitet med den namngivna bilagan är inte verifierad.

## Endast två rättningar
1. **Rörlig rök:** byt den täta puffeffekten mot några sammanhängande, tunna och överlappande slingor. De föds längs bubblans upplösande kanter, böjer sig varsamt och minskar i utbredning mot en gemensam punkt inne i rätt kategori. Variera bredd och transparens med fasta parametrar. Behåll mjuka men synliga konturer och bara ett fåtal små ljuspartiklar. Ingen stor halo, utåtriktad rök eller spridning över flera kategorier. Bubbeltexten försvinner tillsammans med sin bubbla.
2. **Telefonkant:** rätta endast det berörda bakgrundsområdet med befintlig originalreferens och en konturanpassad lokal övergång som bevarar ramen. Avlägsna den extra övre konturen. Ändra inte fungerande gränssnitt eller dess koordinater; ingen stor suddig/täckande rektangel eller ny telefon.

## Låst
- Exakta färg–uppgift–kategori-kopplingar, ordningsföljd, väntande svävning, färdbanor, starttider, krympning, befintlig glöd och uppgiftstexternas visningstid.
- Kategorier, statusikoner, meny, originallogotyp, miljö, komposition, kamera, partiklar i luften och ljud.
- Sluttexten **Not everything needs to stay in your head.** med nuvarande placering och synlighet till sista bildrutan.
- 20 sekunder, liggande 16:9. Appen, konton och det publicerade introt lämnas orörda. Ingen publicering.

## Kontroll och leverans
- Jämför v5 och nästa version vid första/sista bildrutan och varje övergång. Kontrollera att ändringar utanför röken och det lokala kantområdet saknas.
- Granska varje absorption över sammanhängande bildrutor: synliga slingor, rätt gemensam målpunkt, full absorption före befintlig textvisning och inga återkommande rester.
- Kontrollera telefonkanten i början, under alla fyra övergångar och i avslutningen.
- Exportera en ny versionsnamngiven MP4 och spara redigerbar källa med tillgångar för framtida ändringar. Bevara äldre versioner.
- Kontrollera format, längd, ljudspår och full avkodning. Försök spela hela filmen i en separat spelare; redovisa om uppspelning eller lyssning inte faktiskt kan verifieras. Visa MP4 direkt i chatten, med konkret redovisning av ändringar och kvarstående begränsningar.

## Tekniska gränser
Använd samma Python/Pillow/NumPy-rendering. Röken och dess variation ska vara deterministiska vid varje export. Ingen ändring av `bubble_state`, `FX`, `T0`, `TXT`, textsträngar eller destinationskoordinater för bubblornas färd. Korrigeringen utgår från v5-källan och dess befintliga originalbilder, inte MP4-filens inbakade objekt.

**Förfining och export startar efter godkännande av planen.**
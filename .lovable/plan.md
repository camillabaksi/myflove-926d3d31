# Fler vård- och vardagspictogram i Family Flow

## Mål
Utöka det befintliga barnschemats pictogrambank med neutrala vårdbesök och vanliga vardagsärenden, utan att ändra aktivitetsmodellen, kalenderkopplingen eller stödet för egna bilder.

## Det som byggs
- Lägg till kategorin **Vård** och konsekventa Lucide-baserade pictogram för doktor, tandläkare, sjukhus, apotek, vårdcentral, vaccination, sjuksköterska, provtagning/undersökning, akut vård, samtal/psykolog, optiker, hörselmottagning och fysioterapi/rehab.
- Komplettera vardagsbanken med Handla, Städa och Tvätta samt säkerställ att Buss, Tåg, Skola, Läxa, Hem, Äta, Duscha, Borsta tänderna, Sova, Packa, Klä på sig, Simning, Träning, Fritid, Familj, Kompis och Paus finns med kort svensk text.
- Ge varje val relevanta svenska sökord, inklusive vardagliga benämningar, så att de hittas snabbt i den befintliga kompakta väljaren.
- Behåll samma visuella pictogramkomponent, färgtoner och privata fotoalternativ. Vårdvalen beskriver besök och handlingar, inte diagnoser.
- Uppdatera Lucide/ISC-licensdokumentationen och båda ändringsloggarna.

## Teknisk lösning
- Utöka befintliga `VisualActivityCategory`, `PictogramId`, `ACTIVITY_BANK` och ikonmappningen; inga nya tabeller eller parallella aktiviteter skapas.
- Behåll bakåtkompatibel metadataavkodning och lägg till legacy-mappning där den hjälper äldre emoji-data.
- Lägg tester för vårdkategorin, svenska sökord, vardagspictogram och metadata-roundtrip.

## Verifiering
- Kör riktade tester, hela testsuiten och typkontroll; kontrollera därefter aktuellt bygge.
- Kontrollera pictogramväljaren och schemat på 360, 375, 390 och 430 px samt desktop utan horisontell overflow.

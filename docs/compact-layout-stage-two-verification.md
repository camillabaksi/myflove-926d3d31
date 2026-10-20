# Kompaktare sidlayout – rubriksteg 2026-10-20

Gemensamt öppet rubrikblock infördes på Min plats, Inställningar, Anteckningar, Pace-inställningar, Mitt batteri, Återhämtning, Profil, Planera, Påminnelser och Historik. Befintliga texter, rubrik-ID:n och handlingar behålls. Planeras yttre bredd ger utrymme för den redan befintliga tvåspaltslayouten. Godkända Pace/Mer och övriga rubrikkomponenter lämnas orörda. Planeras befintliga sidmetadata kompletterades med beskrivning och delningsmetadata.

## Verifierat
- Automatisk byggkontroll: build OK, senaste post 2026-10-20T11:15:19Z.
- 10 tester i page-header, design-system och flow-settings-presentation: godkända.
- Fem befintliga påminnelsetester för gruppering, återaktivering och bevarade utkast: godkända.
- Nio sidor (alla ovan utom Påminnelser) kontrollerade inloggat vid 360/390/430/768/1280/1600 px, normal text och 32px rottext i ljust/mörkt läge: ingen horisontell dokumentoverflow. Rottext är en emulering, inte fysisk enhetskontroll.
- Efterbilder för 390/1280 px och mörk förstorad rubrik finns under /tmp/browser/compact-stage2. Min plats mobil, Planera desktop och mörk förstorad Min plats-rubrik bildgranskade.
- Påminnelsers befintliga Lägg till öppnar samma dialog och Escape stänger den efter övergången utan sparning. Min plats-länken öppnar Mitt batteri.

## Begränsningar
- Hela appens rubrikutrullning är inte klar; detta är tio sidor i den godkända stegvisa riktningen. Flikar, knappar och kortavstånd väntar på nästa steg.
- Tre äldre testförväntningar faller: två batteritester förväntar ett incheckningsformulär som inte finns på dagens sida, och ett påminnelsetest förväntar knappnamnet ”Lägg till påminnelse” där den befintliga knappen redan heter ”Lägg till”. Ändringarna återinför inte gamla funktioner för att tillfredsställa testerna.
- Tidiga förebilder fångades under sidövergång och är tomma; de är inte giltigt jämförelseunderlag. Ingen tillförlitlig före/efter-pixeljämförelse görs.
- Ingen molnsparning, chatt, fysisk enhet eller skärmläsare testad i denna presentationsetapp. Ingen publicering.
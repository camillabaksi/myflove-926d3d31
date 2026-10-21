# Det som också tog plats — 2026-10-21

## Genomfört
Gemensam frivillig skrivyta på Idag före Pace-stödet och via Pace-chatten. Fri text först, valfria kategorier, explicit spara och datumhistorik. Befintlig krypterad kontolagring/synk används med separat registrerad nyckel. Append-only UUID-revisioner behåller konkurrerande versioner; användaren väljer vilken som ska användas. Att tömma anteckningen behåller historiken.

Osparade utkast stannar i kontobundet sessionsminne vid dialogstängning, navigation och datumbyte; rensas vid utloggning/identitetsbyte. Att lämna webbsidan varnar. Utkast överlever inte stängd webbläsare eller utloggning: använd Spara för beständig lagring. Datumet ändras inte automatiskt mitt i skrivandet vid midnatt.

## Kontroller
- Granskarfynd om förlorade utkast, tom första sparning och midnatt rättade.
- 35 riktade tester i sju filer passerar: datum, fri text, konkurrerande versioner, radering med historik, kontobyte, sena skrivningar, samtyckesspärr, lokal kryptering och cloud-manifest. Senaste automatiska bygge visar build OK.
- Inloggad webbläsare: syntetisk anteckning sparad lokalt, samma text återläst via Pace-ingången, osparat utkast återläst efter dialogstängning. Alla kontoskrivningar blockerades för att skydda användarens konto.
- Mobil/dator 320, 390, 768 och 1280 px: ingen horisontell dokumentöverströmning; mobil-/datorbilder granskade. Synkfel i bilderna är avsiktligt framkallade av nätverksspärren, inte verifierad produktionssynk.
- Läste aktuella familjedelningsfunktioner: den nya anteckningsnyckeln ingår inte i `get_family_shared_data`-funktionens uttryckliga nyckellista. Barnfunktionens aktivitetsschema läser inte user_kv.

## Kvarvarande begränsningar
Privat anteckning skickas aldrig till chatt, AI, aktiviteter eller batteri. Överföring till Pace är spärrad även efter samtycke eftersom content-free tjänsteloggning inte är verifierad; befintlig Få ihop dagen kan användas utan textöverföring. Därför är önskemålet om textbaserad omplaneringshjälp inte färdigställt.

Verklig molnsparning/två-enhetssynk kräver isolerat testkonto. Fysisk mobil, skärmläsare, full mörkläges-/200 %-matris och fullständig dynamisk familje-/RLS-kontroll återstår. Ingen publicering, databasändring, mejlmalländring eller native-ändring.
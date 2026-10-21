# Det som också tog plats

## Det du får
- En liten lugn skrivyta på **Idag**, nära **Din dag** och före Pace-stödet, i appens befintliga ivory/plum/lavendel.
- Rubriken **Det som också tog plats** och ett fritt skrivfält är huvudsaken. Inga kategorier eller energivärden krävs.
- Små frivilliga kategoriförslag under fältet, exempelvis **Oväntat**, **Omsorg**, **Praktiskt** och **Annat**. De väljs aldrig automatiskt och ändrar inte texten.
- En privat anteckning per konto och lokalt datum. Du kan öppna tidigare datum, läsa och ändra anteckningen; tomma dagar skapar inga poster. Sparstatus och eventuella fel visas utan att text försvinner.
- En diskret ingång i **Pace-chatten** öppnar samma skrivflöde för samma datum, inte en separat anteckning.

## Frivillig hjälp med omplanering
- **Spara anteckning** är separat från **Använd för omplaneringshjälp**.
- Inför hjälpen visas den anteckning som ska användas och ett omarkerat val: **Ta med denna anteckning när Pace hjälper mig att planera om**.
- Valet gäller bara den aktuella hjälpförfrågan och återställs när den stängs eller konto/datum ändras. Ingen anteckning skickas automatiskt när chatten öppnas eller när du skriver vanliga meddelanden.
- Antagande: fri text används för ett frivilligt samtalsförslag från Pace, inte för att automatiskt tolka nya kalenderposter eller ändra den befintliga beräkningen för Din takt.
- Visa förslaget tillfälligt, utan att lägga anteckningen eller denna hjälpförfrågan i den sparade chatthistoriken. Ett svar kan återge delar av anteckningen; det följer samma tillfälliga visning.
- **Få ihop dagen** behåller sin befintliga förhandsvisning, konfliktkontroll och uttryckliga godkännande. Inga aktiviteter skapas, flyttas eller bockas av av anteckningen. Batteriet påverkas inte.

## Dataskydd och avgränsning
- Återanvänd befintlig kontobunden lagring, synk och lokal kryptering med en ny separat privat lagringsnyckel. Äldre anteckningar och historik lämnas orörda.
- Innehållet får aldrig följa med kalender-/familje-/barndelning, analysdata, felloggar eller vanligt automatiskt Pace-sammanhang.
- Anteckningar bevaras tills användaren själv väljer att ta bort dem; ingen automatisk gallring. Samtidiga ändringar från olika enheter får inte tyst skriva över text.
- Befintliga adresser, inloggning, kalenderfunktioner, native-versioner och mejlmallar ändras inte. Inga nya paket eller databasmigrationer planeras.
- Ingen publicering; separat godkännande krävs efter återrapportering.

## Teknisk genomföring
- En gemensam editor med en dedikerad dagsanteckningshook används från `TodayContent` och `AssistantContent`.
- Registrera den separata nyckeln i befintligt molnmanifest och känslighetsklassning; bevara owner/stash-regler och villkorad synk. Skydda påbörjade utkast mot inkommande synk, kontobyten, midnatt och sena svar; bevara konfliktversioner för uttryckligt användarval.
- Koppla ett uttryckligt, tillfälligt anteckningssammanhang till befintlig Pace-tjänst. Kontrollera tjänstens loggning och historikgräns före anslutning; ingen bred automatisk kontextinsamling eller ny kalenderparser.
- Dokumentera lagrings- och samtyckesgränsen i projektets arkitekturregler. Uppdatera båda ändringsloggarna efter implementationen.

## Granskning och tester före återrapportering
- Konkreta tester för fri text utan kategori/energi, konto + lokalt datum, sparning/återläsning, historiska anteckningar, konflikter och oförändrade aktivitets-/energikällor.
- Tester för utloggning/kontobyte, midnatt, sena svar och att anteckningen inte når familjedelning eller vanliga Pace-anrop.
- Tester för omarkerat samtycke, endast en godkänd förfrågan, återställning och att inget sparas i chatthistoriken från detta hjälpflöde.
- Kontrollera Idag → skriva → spara → återöppna samt Pace → samma anteckning → godkänd hjälp → oförändrad kalender. Använd isolerad testdata, inte testskrivningar i dina privata anteckningar.
- Granska mobil och dator, båda teman, större text, tangentbord/fokus och tydliga sparfel. Kontrollera automatiskt byggresultat och relevanta befintliga tester.
- Redovisa utförda kontroller och kvarstående risker, särskilt verklig fler-enhetssynk, fysisk mobil och eventuell saknad isolerad testmiljö. Om skyddad tillfällig Pace-användning inte kan verifieras kopplas den inte in som om den vore säker.
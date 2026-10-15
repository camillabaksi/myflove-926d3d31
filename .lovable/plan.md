# Tankar – en personlig reflektionsbok

## Granskningen visar
- `/quickflow` är dagens ingång till Tankar/Fånga. Här finns text, röst, bild-/dokumentimport, granskning, sortering, prioritering och sparade tankar.
- `/anteckningar` har redan fria anteckningar, mappar, redigering, omvandling och vägen tillbaka till Fånga. Dessa funktioner och deras sparade innehåll behålls; inget flyttas automatiskt till dagboken.
- Kontolagringen har redan offlinekö, kontoseparering, krypteringsstöd och synk. Nya privata bokdelar kan läggas till utan nya databastabeller eller destruktiv migrering.
- **Risker som behöver hanteras:** befintlig synk sammanfogar poster, inte samtidiga textändringar inne i samma post. Äldre anteckningars Ångra återskapar en ny identitet. Därför får nya dagbokslänkar inte bero på den äldre ångrahanteringen.
- Kodens familjedelning använder en uttrycklig lista över delbara datanycklar. De nya privata bokdelarna ska inte ingå där. Faktiska databasbehörigheter behöver kontrolleras läsande före sparningstester; kodgranskningen ensam verifierar inte dem.

## Sammanhängande upplevelse
Behåll `/quickflow` som Tankars huvudingång och den befintliga huvudnavigationen. Lägg fyra tydliga bokingångar där: **Dagbok · Beslut · Tankekarta · Reflektioner**. Fånga finns kvar som tydlig egen handling med alla nuvarande funktioner; äldre anteckningar och idébank har en synlig länk. Undersidor har tillbaka till Tankar och direktvägar mellan bokdelarna, utan att redigerad text tappas.

### Utseende
- Sidlokal anteckningsbok: ivory `#FAF9F6`, plum `#512654`, diskreta lavendel-/salvia-/aprikosmarkeringar och subtila papperslinjer. Mörkt läge får egna läsbara motsvarigheter.
- Återanvänd det redan inlästa Caveat för anteckningstext, med valbar vanlig lässtil. Rubriker och kontroller behåller appens aktuella typografi. Ingen global typsnittsändring.
- Handritad känsla i små streck och befintliga linjeikoner, inte nya maskotar eller ändrade stenar/logotyper.
- Minst 44 × 44 px för handlingar, tydligt fokus, rem-baserad text och respekt för reducerad rörelse. Papperslinjerna får aldrig styra eller klippa textens radhöjd.

## Säkra genomförandeetapper

### 1. Privat grund, ingångar och Dagbok
- Inför nya bokposter utan att skriva om befintliga anteckningar, Fånga-data eller mappar.
- Dagbok med datum, valfri rubrik, fri flerradig text, flera inlägg, återöppning och fortsatt skrivande.
- Autospara under skrivandet via befintlig kontolagring; visa sanningsenligt väntande/synkat/fel och om lokal krypterad sparning inte fungerar. Visa inte ”sparat” enbart för att en timer gått.
- Behåll den aktiva skrivtexten vid inkommande synk. Säkra återställbara textversioner och synlig konflikthantering innan långtext-autosparandet släpps på; ingen tyst överskrivning mellan enheter.
- Stoppa fördröjda skrivningar på kontobyte och rensa föregående kontos editorurval/fokus/text ur vyn.
- **Kontrollpunkt:** navigation, faktisk sparning/återläsning, omladdning, offline och kontoseparering verifieras innan nästa etapp.

### 2. Beslut och Reflektioner
- Beslut med ämnesrubrik, två lika läsbara pappersspalter: Fördelar och Nackdelar. Valfri tredje del ”Osäkert än”.
- Skriv och redigera punkter direkt på sidan. Separata val för viktighet, stjärna och genomstrykning; flytta mellan spalter och ändra ordning via tillgängliga kontroller. Ingen poängsummering, vinnare eller automatiskt beslut.
- Mobil: samma spaltöversikt när den ryms; fokusläge för en spalt i taget med full textstorlek och bibehållen skrivtext. Ingen mikroskopisk tvåspaltstext eller horisontell dokumentscroll.
- Reflektioner med frivilliga mjuka frågor, egna svar och fri text. Frågor får hoppas över och svar får lämnas öppna.
- ”Hjälp mig sortera tankarna” öppnar frivilliga perspektiv/frågor utan att skicka privat text till AI, välja sida, skapa uppgifter eller ändra något automatiskt.
- Återanvänd etapp 1:s autosparande och skydd för skrivtext.
- **Kontrollpunkt:** inlineinmatning, flytt, återöppning, utkast vid vybyte och mobilens fokusläge.

### 3. Tankekarta och länkar mellan delarna
- Skapa flera kartor med redigerbara bubblor och uttryckliga kopplingar. Flytta med pekare/touch, med särskilt flyttgrepp så textredigering och vanlig sidscroll fortfarande fungerar.
- Lägg till zoom/centrering och en likvärdig listvy för tangentbord och skärmläsare: skapa, redigera, flytta med riktningar och koppla/ta bort kopplingar utan dragning.
- Markerad dagbokstext kan **kopieras** till en vald/ny beslutspunkt eller tankebubbla. Användaren väljer destination och bekräftar; originaltexten ändras aldrig.
- Spara citatet och en länk till ursprungsinlägget. Citatet finns kvar om ursprunget senare ändras eller tas bort; en saknad källa visas neutralt och orsakar ingen kaskadradering.
- **Kontrollpunkt:** hela flödet dagbok → texturval → beslut/karta → tillbaka till oförändrat original.

## Tekniska detaljer och avgränsningar
- Nya skyddade undersidor följer projektets befintliga autentiserade routemönster; befintliga routes och authflöden ändras inte. Varje ny innehållssida får egen Paceable-metadata och noindex.
- Små separata editorer och typade modeller/hooks. Befintliga `useCloudSyncedStorage`, `user_kv` och kontoägarkontroller återanvänds; nya privata datanycklar registreras i synkmanifest och befintlig lista för lokal kryptering. Befintliga nycklar, krypteringsidentiteter och generella synkregler byts inte ut.
- Lagra kartbubblor, kopplingar och beslutspunkter som identifierbara poster, inte hela boken som ett enda utbytbart objekt. Versionsskydd för långtext hålls inom bokdelen, inte som en global synkombyggnad.
- Ingen familje-/kalenderdelning, innehållsloggning till analytics eller AI-anrop för privata boktexter. Läsgranska behörigheter med befintliga verktyg; om skyddet kräver databasändring redovisas skäl och separat avgränsning före genomförande.
- Inga nya paket planeras. Ingen ändring av native, versionsnummer, domäner, push, registrering/inloggning eller publiceringsinställningar. Ingen publicering.

## Verifiering och leverans
- Enhets-/komponenttester för autosparande, återställning, samtidig ändring, kontoavbrott, stabila länkar, punktflytt och kartkopplingar. Kör även berörda befintliga antecknings-/Fånga-, synk-, krypterings- och kontosepareringstester.
- Inloggat end-to-end-test med syntetiskt innehåll i isolerat testkonto: skriv → navigera bort → återöppna → ladda om → kontrollera text; testa offline/återanslutning och kontobyte utan att skriva i Camillas befintliga privata inlägg. Om isolerat konto saknas redovisas detta som blockerad kontroll, inte som godkänt.
- Bilder och kontroller vid 320/360/390/430/768/1280 px, ljust/mörkt och normal/200 % text. Kontrollera även tangentbord, texturval, fokusläge, kartans alternativa vy och att vertikal scroll fungerar.
- Uppdatera båda ändringsloggarna och arkitekturregler för nya bokdelar. Redovisa varje färdig etapp, ändrade filer och faktiska begränsningar. Fysisk Android/iOS, systemtangentbord och VoiceOver/TalkBack markeras som ej verifierade om endast webbtest är möjligt.

**Nu:** endast inventering och plan är gjorda; appen och användardata är oförändrade. Genomförandet startar efter godkännande av denna konkreta etappplan enligt projektets planregel.
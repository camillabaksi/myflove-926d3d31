# Paceable – gemensam kalenderregistrering och planering

## Granskning av det befintliga
- Planera stöder redan flera aktiviteter, **Jag / Barnen / Jag och barnen**, granskning före sparning och säkra återförsök. Det återanvänds, inte ersätts av en ny kalender.
- Idag och kalendern har flera separata snabbformulär. Kalenderns formulär sparar en aktivitet åt gången; vald tid kan inte förifyllas från ett tryck i veckans tidslinje.
- Familjevyerna har redan gruppering med barnens namn, Min dag-filter och barnschema utan avbockning. De behålls och testas även genom det nya snabbflödet.
- Veckan har redan ett kompakt tidsfönster och möjlighet att visa hela dygnet. Förbättringen gäller åtkomst, kvällstider, tomma dagar och läsbarhet – inte en ny tidsmodell.
- Pace-chatten visar godkännandeknappar för uppgiftsförslag, men saknar gemensam kalendergranskning för barn/påminnelser och säkra konfliktkontroller. Titelmatchning kan välja fel vid liknande namn; datumkontrollen behöver bli striktare.

## Det som byggs

### 1. Ett gemensamt snabbflöde
- Återanvänd planeringens befintliga flerradsutkast och sparning i ett kompakt formulär som kan öppnas från Idag, månad, vecka, barnschema och chattens förslag.
- Förifyll vald dag, eventuell starttid, relevant område och valda barn. Varje aktivitet kan justeras separat före **Spara**; ingen sluttid eller påminnelse gissas.
- Lägg till diskreta, namngivna plusknappar vid relevanta dagar och barnscheman. Veckans tomma tidsyta kan öppna samma formulär med vald tid; tangentbordsalternativ finns. Tom tidsyta betecknas inte automatiskt som ledig.
- Behåll befintliga vägar för rutiner, medicin, Fånga, genomförda aktiviteter och andra specialformulär. Avbryt sparar ingenting; vybyte får inte radera påbörjat utkast. Kontobyte rensar utkast.

### 2. Kompakt kalender och direkt redigering
- Månad får en traditionell sjukolumnsgrid, lätt rundade datumrutor och en prick per faktiskt förekommande kategori. Behåll idag/vald dag, aktivitetsantal och en kompakt vald-dag-lista.
- Vecka visar samma tidsskala för alla dagar, med mindre tomrum och lätt åtkomst till 00–24. Aktiviteter efter 19 och nära midnatt ska gå att se och välja.
- Öppna aktivitetens detaljer och tillåten redigering direkt från månad/vecka. Egna uppgifter, kalenderposter och ägda barnaktiviteter ändras i sin ursprungliga källa; externa och endast delade poster behåller sina rättighetsgränser.
- Återkommande poster visar tydligt vilken omfattning som kan ändras. Ingen förekomst flyttas som om den vore en engångspost, och inget undantag simuleras om källan saknar stöd.

### 3. Barn och egen dag
- Samma inmatning stödjer ett eller flera ägda barn och vid behov förälderns egen aktivitet.
- Gruppera samma barnhändelse till en visningsrad med alla valda namn. Behåll varje ursprunglig post och dess identifierare; olika sluttider eller platser får inte slås ihop av misstag.
- Enbart **Min dag** utesluter barnschema. Egna föräldrauppgifter finns kvar, även när de gäller barn. Barnschema på Idag saknar alltid avbockning.
- Återanvänd Mulberry-bildstöd och befintliga familjeval. Inga nya delningsrättigheter, privata profiluppgifter eller hälsodata används.

### 4. Pace-chatten med gemensam granskning
- Utöka befintliga svenska förslag till skapa flera aktiviteter, välja person/område, datum/tid och uttryckligen vald påminnelse. Fråga bara när person, datum, målaktivitet eller annan väsentlig uppgift inte kan avgöras säkert.
- Visa strukturerad förhandsgranskning med alla aktiviteter och eventuella konflikter före godkännande. Chatttext, inklusive ett vanligt ”ja”, skriver inte själv till kalendern.
- Flytt/ändring visar före/efter. Matcha stabila källidentifierare; vid tvetydiga titlar väljer användaren rätt aktivitet. Kontrollera aktuellt konto, ägarskap, återkomst, senaste innehåll och konflikter igen vid godkännande.
- Kända tidsöverlapp visas konkret; okända längder eller ofullständigt kalenderunderlag får inte innebära ”inga konflikter”. Barnens vanliga schema blir inte automatiskt förälderns upptagna tid.
- Återanvänd samma sparning och synk som formuläret. Vid delvis lyckad sparning visas vad som faktiskt sparats och återförsök får inte skapa kopior.

### 5. Planera idag, imorgon och veckan
- Använd samma fleraktivitetsflöde i egen och barnens planering, med snabb schemaåtkomst från Idag.
- Återanvänd redan loggad kapacitet och befintligt hemma/jobb/skola-sammanhang för varsamma förslag. Fasta aktiviteter försvinner inte vid sammanhangsval.
- Ingen automatisk batteriändring, energiprognos för framtida dagar eller automatisk omplanering. Förslag kräver godkännande.

## Design och skyddsgränser
- Befintlig varm ivory, plum-text och subtil lavendel/salvia/aprikos med lokala semantiska färger. Mobil först, läsbar text och minst 44 × 44 px tryckytor; inga extra inställningsblock ovanför dagens innehåll.
- Behåll befintlig typografi, logotyp, stenar, navigation, kontoavskiljning, kryptering, lagringsnycklar, synk, integrationer och iOS/Android.
- Ingen ny databas, migration, behörighetsutvidgning, inloggningsändring eller nya paket planeras. Om någon önskad funktion kräver det redovisas behovet innan en sådan ändring görs.
- **Ingenting publiceras.** Alla delar ingår i uppdraget och genomförs i denna ordning efter godkännande av planen; ingen ytterligare etappbeställning behövs.

## Teknisk genomförandeplan
- Utgå från `PlanningWorkspace`, `PlanningDraft`, `planningTasks`, `childPlanningRows` och befintliga kontoägda mutationshooks. Separera återanvändbart formulär/utkast från sidans navigation, utan ny persistent utkastlagring.
- Anslut `calendar-planner.tsx`, Idags tillägg, barnschemats befintliga öppnare och `assistant-content.tsx`. Kalenderprojektionen i `visual-calendar.ts`/`use-visual-calendar.ts` förblir en läsvy.
- Återanvänd `family-calendar`/`family-perspective` och källornas ursprungliga ID:n för gruppering och redigering. Ingen generell titelbaserad deduplicering av oberoende händelser.
- Utöka `flow-actions.ts` med validerade kalenderförslag och använd befintlig autentiserad `flow-chat.functions.ts` för förslag, aldrig AI-styrda skrivningar. Behåll modell, sessionöverföring och befintliga integritetsgränser; skicka inte fler privata anteckningar eller profiler till AI.
- Datum beräknas som kalenderdatum i befintlig tidszon, inte genom att lägga 24 timmar till en tidpunkt. Påminnelser och återkomst behåller respektive källas befintliga regler och opt-in; stöd som saknas visas som begränsning.
- Dokumentera strukturella regler i `AGENTS.md`, uppdatera `CHANGELOG.md`, `src/lib/changelog.ts` och roadmap när implementationen genomförs.

## Verifiering och redovisning
- Riktade beteendetester: flera aktiviteter, skapa/redigera/flytta/avbryt, förifylld dag/tid, båda mottagartyperna, flera barn, gruppering utan dataförlust, Min dag, inga barncheckboxar, konflikt/okänd längd, tidszon/sommartidsbyte och återkomst.
- Skyddstester: tvetydiga mål, skrivskyddade/delade källor, manipulerade person-ID:n, kontobyte, föråldrade förslag, dubbelklick, partiell sparning och säkra återförsök; oförändrat batteri.
- Kör relevanta befintliga regressionstester och kontrollera automatiska byggresultat. Ingen manuell projektbuild eller typkontroll.
- Kontrollera inloggad webbvy på 320, 360, 390, 430, 768 och 1280 px, båda teman, normal/stor text, tangentbord/fokus, horisontell veckorullning och vertikal scroll.
- Verifiera verklig skapa → återläsning → redigera/flytta i ett isolerat testkonto. Camillas privata konto ska inte fyllas med testaktiviteter; om lämpligt konto saknas redovisas det som blockerad end-to-end-kontroll.
- Slutrapporten skiljer faktiskt genomförda delar och tester från kvarstående begränsningar. Fysisk iOS/Android, systemtextförstoring och VoiceOver/TalkBack kräver riktiga enheter.
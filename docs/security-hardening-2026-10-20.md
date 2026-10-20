# Säkerhetsrättningar 2026-10-20

## Genomfört utan kontoinnehåll eller publicering

- `secure-local` ogiltigförklarar asynkron upplåsning, kryptering och storage-event-dekryptering vid varje låsning. Sena svar får inte ändra nästa sessions cache, status eller lokala värden. Den befintliga enhetsnyckeln och krypteringsformatet bevaras.
- Ett sent initialt auth-svar får inte skriva över senare auth-händelser. Vanlig tokenförnyelse behåller kontot och dess minne.
- Paceable-prefikset och tre tidigare saknade molnnycklar använder befintlig kontoseparering; inga nycklar byts och inga användarvärden migreras genom en bakgrundsskrivning.
- Den publika endpoint-baserade push-återregistreringen ger 410 utan databasåtkomst. Worker-förnyelsen kontaktar öppna appfönster; appen använder befintlig autentiserad registrering. Inga sessionstoken lagras i workern. Om förnyelsen sker utan öppet appfönster kan notiser pausa tills nästa appöppning.
- Både nya och sparade pushdestinationer kontrolleras före utskick; bara betrodda HTTPS-tjänster, inga inloggningsuppgifter/alternativa portar och inga HTTP-omdirigeringar.
- Nya pushloggar innehåller inte notistitel, referens, tagg eller endpointfragment. CSP-rapporter är begränsade till 16 KiB/10 rapporter och loggar enbart allowlistade kategorier. Felrapporteringen skickar neutral text utan ursprungligt fel, URL eller komponentstack; tidigare loggrader lämnas orörda.
- HTML får separat verkställd object/base/frame-policy; befintlig full integrations-CSP är fortsatt report-only. Alla serverresponsers content-sniffing stängs av och referrer begränsas. Detta är inte ett fullständigt XSS-skydd.
- Kompatibla säkerhetsversioner och samstämmiga textlåsfiler. Testverktyget uppgraderades till Vitest 4 för att rätta mocker/tinypool-riskerna. Native ID:n, host, signering och versionsnummer är oförändrade.

## Verifierat

- 101 tester i 15 riktade filer passerade efter kod-, paket- och sessionsrättningar. Inkluderar konkret fördröjd upplåsning/utloggning, cross-tab-dekryptering/utloggning, sent initialt auth-svar, tokenförnyelse, kontoförråd, molnsynk, pushregistrering/-leverans/-cron, worker-förnyelse, privata diagnostikfält och strukturella headers.
- 25 SQL-assertioner i en tillfällig PostgreSQL-instans med syntetiska identiteter och relevanta verkliga migrationsförutsättningar: otillåtet hushållsinträde, medlemsflytt, barns råa rader/dokument, privata RPC-noter och utomståendes åtkomst nekades; ägare/vuxen och explicit delade aktiviteter samt normala inbjudningar fungerade. Den faktiska migrationen 0024 kördes. Testet använder stubbat auth/storage, inte en full driftmiljö. Se `tests/security/household-rls.sql`.
- `bun audit` gav `{}` inklusive testberoenden. Den nya produktionsgranskningen fann inga kända sårbarheter i 76 beroenden.
- Grundläggande databas-/säkerhetsskanning gav inga fynd. Detta verktyg kör inte automatisk djupkodanalys. Flera äldre automatiska granskningsresultat är fortfarande inaktuella/ofullständiga.
- Ny browserkontroll: offentliga sidan HTTP 200 med verkställd CSP och nosniff; inloggningssidan renderades utan pageerror; osäkra återregistreringsanrop gav 410. Ingen inloggning till personkonto, anteckningsläsning eller kontoskrivning användes.
- Previewbygget var godkänt efter rättningarna; aktuellt resultat läses i byggloggen innan avslut.

## Begränsningar inför bred spridning

- Full testsuite: 1 026 passerade, 20 misslyckade och 6 obearbetade testfel av 1 046 tester vid den första fullkörningen. Därefter rättades två föråldrade förväntningar på kontots tema; fullsuiten är inte omkörd. Övriga fel berör äldre presentationer/mocks samt Vitest-4:s URL-hantering i ett CSS-test, inte verifierade exploateringar. De kan inte generellt avfärdas som tidigare befintliga utan en basjämförelse.
- Ingen verklig konto-A/konto-B end-to-end, full auth/OAuth, native-signering eller låst-telefon-push testades. Det skulle kräva isolerade testkonton/testmiljö; Camillas konto och anteckningar användes inte.
- Lokal SQL-verifiering bevisar inte ensam driftens kompletta policies eller alla andra familjetabeller. Den tidigare 0024-migrationens registrering är bevarad; ingen ny produktionsdataskrivning utfördes i detta steg.
- Ingen automatisk aktuell djupanalys har kunnat bekräftas genom de tillgängliga säkerhetsverktygen. Inga fynd har dolts eller ignorerats.
- Kodrättningarna är inte publicerade. Bred spridning bör vänta på publicering efter granskning och återstående isolerade kontroller.
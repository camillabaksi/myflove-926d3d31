# Verifiering: kontosynk och privat push-autentisering

Granskad bas: `bedf4be063bbd4327416ce6b707b012e32157b26` på `main`.

## Beteende

- Synkningen binder varje försök till lokal dataägare och auth-sessionens
  generation. Efter upplåsning, användarkontroll, läsning och skrivning kontrolleras
  att sessionen fortfarande gäller. Sena svar och fel uppdaterar inte lokala
  värden, synkmetadata eller status för en ny session. En vanlig tokenförnyelse
  behåller samma generation.
- En gammal användarkontroll får inte återfylla användarcachen eller tömma nästa
  sessions pågående användarkontroll.
- Push-jobbet kräver en privat Bearer-hemlighet före läsning av användardata eller
  utskick. Publik apikey accepteras inte som autentisering. Verifieringsfel stänger
  med 503; verifieringen returnerar bara ett booleskt svar.

## Genomförda kontroller

- Nya synkregressioner återskapade fyra fel med den ursprungliga koden, inklusive
  sent skrivsvar efter utloggning och ett gammalt auth-anrop som blockerar nästa
  session. Alla synktester passerar efter ändringen.
- 23 tester i `cloud-sync.test.ts` och `push-tick-auth.test.ts` passerar. Push-testet
  kör den faktiska route-handlern med databas- och utskicksmockar och verifierar
  att avvisade anrop aldrig läser påminnelser eller skickar notiser.
- Hela testsuiten: 586 passerade, 2 misslyckade av 588. De två felen finns även på
  basversionen: `flow-checkin-popup.test.tsx` nekas klick av `pointer-events: none`.
- `npm run build` och `npx tsc --noEmit` passerar. ESLint på samtliga ändrade
  TypeScript-filer passerar.
- SQL-scriptet exekverades i lokal PGlite/PostgreSQL med pgcrypto och lokala
  testdubblar för Vault, cron och HTTP. Kontrollerade rätt/fel/saknad hemlighet,
  faktiska rollbehörigheter, genererade HTTP-headers, oförändrad tid/URL, upprepad
  körning utan ny hemlighet samt transaktionsavbrott för oväntat jobbformat.
  Detta verifierar SQL-logiken men ersätter inte en kontroll i riktig Supabase.

## Databasförberedelse genomförd 2026-10-10

Efter användarens uttryckliga godkännande kördes
`ops/bootstrap-push-tick-auth.sql` med COMMIT i projektets produktionsdatabas.
En efterföljande läskontroll verifierade att den privata Vault-hemligheten
godkänns, felaktig och saknad hemlighet nekas, anon och authenticated saknar
EXECUTE och service_role har EXECUTE. Det aktiva `myflove-push-tick` använder
Authorization från Vault och behåller apikey och sitt minut-schema.

Den publicerade appens serverkod har inte ändrats. Den nya synkningen och
handlerns krav på privat autentisering börjar därför gälla först när koden
publiceras. Databasförberedelsen behåller kompatibilitet med befintlig serverkod.

## Kodinförande återstår

Arbetsgren på GitHub: `codex/account-sync-and-push-auth`.
Ändringen ska granskas före införande i `main` och publicering av appkoden.

Den inaktuella npm-låsfilen rättades inte i denna ändring. Beroenden installerades
för verifiering med `npm install --package-lock=false --ignore-scripts`.

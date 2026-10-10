# Privat autentisering för push-jobbet

Den publika Supabase-nyckeln är inte en hemlighet. Den föreslagna `push-tick`-koden accepterar
endast en privat Bearer-hemlighet som verifieras av en RPC med behörighet endast
för `service_role`. Utskick och läsning av användarnas påminnelser börjar först
efter godkänd verifiering. Verifieringsfel ger 503 och öppnar ingen reservväg.

## Status 2026-10-10

Databassteg 1–2 nedan är genomförda och verifierade i projekt
`64509658-f677-4ff5-b744-7142596dea24` efter uttryckligt godkännande.
Den nya serverkoden är ännu inte publicerad; den befintliga handlerns
autentisering gäller fram till publicering. Inga hemligheter finns i paketet.

## Aktivering

1. Kör `ops/bootstrap-push-tick-auth.sql` som databasadministratör före publicering.
   Scriptet skapar en slumpmässig 256-bitars hemlighet i Supabase Vault, låser
   verifieringsfunktionen och lägger till Authorization i `myflove-push-tick`.
   Hemligheten visas aldrig och ska inte kopieras till GitHub eller klientkod.
2. Kontrollera att jobbet är aktivt med samma schema och URL som tidigare, att
   Authorization hämtas från Vault och att endast service_role kan köra RPC:n.
3. Publicera serverkoden. Ett POST med bara den publika apikey:n ska ge 401.
   Använd cron-jobbets ordinarie körning för kontroll av godkända anrop; ett
   manuellt godkänt POST kan skicka riktiga användarnotiser.

Databassteget behåller jobbets gamla headers för att befintlig serverkod ska
fungera fram till publicering. Den nya servern ignorerar apikey helt. Scriptet
kan köras igen utan att byta hemlighet eller ändra jobbets tid/URL. Ett oväntat
jobbformat avbryter hela transaktionen. Vid återgång av serverkoden fortsätter
det redan förberedda jobbet fungera eftersom den gamla headern finns kvar.

För att rotera hemligheten, uppdatera den namngivna Vault-posten som
databasadministratör. Jobbet och verifieringen läser då samma nya hemlighet;
inget bygge eller klientbyte behövs. Återskapa/regenerera Supabase-typerna efter
att RPC:n införts för att kunna ersätta den lokala typbryggan.

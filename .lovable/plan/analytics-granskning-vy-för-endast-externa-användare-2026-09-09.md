# Analytics-granskning + vy för "Endast externa användare"

## Vad jag hittade (inspektion, inget ändrat)

**Var händelserna sparas:** tabellen `analytics_events`. Varje rad har bara fyra
uppgifter: ett slumpat sessions-id, vilken del av appen (`section`), vilken
handling (`action`) och tidpunkt.

**Vilket fält identifierar användaren:** inget. Det finns medvetet **ingen**
koppling till konto, e-post eller IP. Loggningen är byggd som helt anonym, och
det står uttryckligen i koden att användar-id aldrig sparas.

**Sessions-id:t:** ett slumpat id som ligger kvar i webbläsarens lokala lagring.
Det är alltså "en webbläsare/enhet", inte "ett besök" och inte "en person". Samma
person på mobil och dator blir två id:n; rensad webbläsardata ger ett nytt id.

**Kan anonyma besökare kopplas till ett konto:** nej, inte i dag och inte
retroaktivt. Det finns ingen lagrad brygga mellan sessions-id och inloggning.

**Hur ditt eget konto kan identifieras:** i databasen, ja – du är den enda med
admin-rollen, och demokontot känns igen på sin e-post. Men den kopplingen finns
bara på kontosidan, inte i händelseloggen.

**Kan de befintliga händelserna fördelas per användare:** nej. Det går inte att
säga säkert hur många som kom från dig – det vore att gissa.

**Verklig volym just nu:** 27 077 händelser från 1 004 olika webbläsare
(9 juli – idag). Siffran 1 000 motsvarar alltså antalet sessions-id:n, inte antal
händelser.

**Vad datan ändå antyder om ditt eget bruk:** fyra id:n sticker ut kraftigt och
sträcker sig över hela projektets livslängd (6 000 händelser över 38 dagar,
1 716 över 30 dagar, 1 176 över 32 dagar med aktivitet just nu, 794 över 4 dagar).
Tillsammans är de ca 40 % av all volym. Det ser ut som utvecklings- och
testanvändning, men det är en indikation – inte ett bevis.

## Förslag: så gör vi det säkert framåt

Ingen befintlig rad ändras eller raderas. Vi lägger till märkning, inte historik.

1. **Ny tabell `analytics_session_owners`** – kopplar ett sessions-id till en
   inloggad användare första gången hen är inloggad i den webbläsaren, plus en
   flagga `is_internal` (admin- eller demokonto). Kopplingen skrivs bara för
   inloggade och kan inte läsas av vanliga användare.
2. **Märk dina egna id:n manuellt** – du får en knapp i adminvyn: "Markera den
   här webbläsaren som intern". Då märks just det id:t utan att någon data rörs.
3. **Adminvy "Analys per användare"** med: totalt antal händelser, antal unika
   användare, händelser per användare, senaste aktivitet, antal aktiva dagar,
   samt vilka som är admin/demo/intern.
4. **Växlare "Endast externa användare"** överst, påslagen som förval. Den
   filtrerar bort märkta interna id:n i alla siffror och diagram.
5. **Historiken hanteras ärligt:** allt före märkningen visas som "okänd
   härkomst" med möjlighet att märka enskilda id:n som interna i listan. Så kan
   du rensa dina fyra egna id:n och få en trovärdig extern siffra – manuellt
   bekräftad, inte gissad.

## För investerarsamtalet

Efter märkningen kan du säga exakt: "X händelser från externa användare, Y från
intern test" – och stå för hur gränsen dragits.

## Tekniska detaljer

- Migration: `CREATE TABLE public.analytics_session_owners (session_id text primary key, user_id uuid, is_internal boolean not null default false, marked_by uuid, created_at, updated_at)` med GRANT till `authenticated`/`service_role` och RLS där bara admin läser och skriver.
- Ny serverfunktion `getUserAnalyticsFn` i `src/lib/analytics.functions.ts`, samma admin-kontroll som `getAnalyticsSummaryFn`, joinar events mot ägartabellen och tar parametern `excludeInternal`.
- `claimAnalyticsSessionFn` skriver kopplingen vid inloggning; `markAnalyticsSessionInternalFn` sätter flaggan från adminvyn.
- Ny flik i `src/pages/admin-stats.tsx`; befintliga vyer och `analytics_events` lämnas orörda.

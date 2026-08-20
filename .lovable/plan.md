# Testa Min dag i en riktig inloggad session

## Vad jag hittade i projektet

- **Auth**: Supabase e-post/lösenord via en Clerk-kompatibel shim (`src/compat/clerk.tsx`). Hela appen ligger bakom `src/routes/_app.tsx`, som är `ssr: false` och skickar till `/sign-in` utan session. Det finns ingen dev-bypass idag – bra.
- **Testanvändare**: det finns 20+ riktiga konton. Ett heter `test@hotmail.com` (skapat 2026-07-09, har aldrig loggat in), men det är inte skapat av oss och ska inte kapas.
- **Ingen seed/demo-data**: inga fixtures eller `import.meta.env.DEV`-lägen finns. Enda "demo"-datan är fiktiva texter i MyFlove Insight.
- **Datalagring**: nästan all app-data (uppgifter, rutiner, energilogg m.m.) sparas per användare i `public.user_kv` via `src/lib/cloud-storage.ts`, plus egna tabeller för påminnelser/kalender. Allt är RLS-skyddat per `user_id`, så ett testkonto kan aldrig se eller röra någon annans data.
- **Testsession**: plattformen kan redan skapa en tillfällig, kortlivad inloggad session åt agenten för en vald användare i det här projektet. Ingen kod, inget lösenord och ingen bypass behövs för att använda den.

## Rekommendation

Använd plattformens sessionsminting mot ett **dedikerat QA-konto som vi skapar och tar bort igen** – inte mot ditt eget konto och inte mot någon befintlig användares konto.

Det är den säkraste och billigaste vägen: inga kodändringar, inget lösenord i repot, ingen permanent testanvändare, ingen produktionsdata påverkas.

## Så går det till

1. **Skapa QA-kontot** via backendens admin-API: e-post av typen `qa-minday+<datum>@myflove.test`, ett slumpgenererat engångslösenord som varken sparas i repo eller visas i chatten, e-post förbekräftad så inget riktigt mejl skickas. Kontot får inga roller och ingen hushållstillhörighet.
2. **Mint en kortlivad session** för just det användar-id:t och kör den i webbläsaren mot förhandsvisningen. Sessionen ligger bara i sandboxen och loggas aldrig.
3. **Kör igenom testlistan** i mobilstorlek (411 × 743, samma som din telefon):
   - logga in och landa i appen
   - tom dag: Min dag utan något inlagt (batteri, energibalans, tomtext ska inte krascha)
   - lägga till aktivitet via ＋ Lägg till
   - redigera aktivitet (tid/text) i tidslinjen
   - markera klar
   - ta bort aktivitet
   - Mitt batteri: nivå, riktning, expandera till kurva
   - dagens energibalans-mening
   - ett Flow-förslag
   - mobil layout: inget överfullt, inget som klipps
4. **Rapport med skärmbilder** per steg och eventuella konsolfel.
5. **Städa upp**: radera QA-användaren, vilket via `on delete cascade` tar bort dess rader i `user_kv` och övriga användartabeller. Efter testet finns inget testkonto kvar.

## Vad som påverkas

- **Inga filer i `src/` ändras.** Ingen ny route, inget dev-läge, ingen bypass, inga hårdkodade uppgifter.
- **Databas**: en tillfällig rad i auth-tabellen plus de rader QA-kontot själv skapar under testet. Allt raderas i steg 5.
- **Inställningar**: inga ändringar i auth-konfiguration (ingen auto-confirm globalt, inga anonyma inloggningar).

## Alternativ jag avråder från

- **Använda `test@hotmail.com`**: okänd ägare, kan vara en riktig person.
- **Använda ditt eget konto**: testdata skulle blandas med din verkliga vardag.
- **Dev-only inloggningsknapp eller mockad auth**: kräver kod i produktionsgrenen och är precis den typ av bypass vi vill undvika.

## Om du hellre vill

Vill du behålla ett permanent familj-/testkonto (t.ex. för att visa appen för andra) kan vi i stället skapa ett vanligt konto via den vanliga registreringssidan, som du själv äger lösenordet till. Det är säkert men lämnar ett konto kvar – säg till om du föredrar det.

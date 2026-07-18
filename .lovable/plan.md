## Vad du får

Riktiga push-notiser som når din telefon även när MyFlove är stängd:
- **Medicin** – när det är dags och du inte kryssat i
- **Uppgifts-loopar** – tvätt klar (~50 min), disk (~55 min), ugn (~25 min) osv.
- **Uppgifter med tid** – när klockslaget passerar och den inte är avbockad
- **Väder** – morgonpuff om regn/kyla/värme väntas idag

## Så funkar det

1. Du installerar MyFlove på hemskärmen (PWA – redan klart).
2. Första gången du öppnar appen frågar den om lov att skicka notiser.
3. Servern kollar var 5:e minut vad som ska gå ut till dig och skickar via Web Push.

**Viktig gräns för iPhone:** Push-notiser i PWA funkar bara om appen är **installerad på hemskärmen** (iOS 16.4+). I vanlig Safari-flik funkar det inte – det är Apples begränsning, inte MyFloves.

## Vad jag bygger

**Frontend**
- Service worker `public/sw.js` som tar emot push-events och visar notisen (även när appen är stängd).
- En "Aktivera notiser"-knapp på hemskärmen som ber om lov och sparar prenumerationen.
- Guarded registrering – service workern kör aldrig i Lovable-preview, bara i den publicerade appen.

**Backend (Lovable Cloud)**
- Ny tabell `push_subscriptions` (user_id, endpoint, keys, enabled) med RLS så du bara ser dina egna.
- Ny tabell `push_preferences` (medicin, loopar, väder på/av per användare) + inställningar i appen.
- Server function `subscribeToPush` – sparar prenumerationen.
- Server function `unsubscribeFromPush` – tar bort den.
- Publik hook-route `/api/public/hooks/push-tick` skyddad med `apikey` – kollar vilka notiser som ska ut just nu.
- pg_cron var 5:e minut som anropar hook-routen.

**Väder-schemaläggning**
- Varje morgon kl 07:00 kollar servern väder för din senast kända plats (från weather-card) och skickar puff om paraply/varma kläder behövs.

## Teknisk sektion

- **VAPID-nycklar**: genereras en gång och sparas som `VAPID_PUBLIC_KEY` (publik, i client) och `VAPID_PRIVATE_KEY` (secret). Publik nyckel exponeras via `import.meta.env`.
- **web-push-signering**: `web-push`-npm är Node-only och kraschar på Cloudflare Workers. Använder istället `@block65/webcrypto-web-push` (Web Crypto, Worker-kompatibel) eller handrullad VAPID-JWT med `crypto.subtle`.
- **Service worker** följer PWA-skill: registreras endast i produktion, aldrig i preview/dev, med kill-switch `?sw=off`.
- **Loop-detektion**: samma logik som `proactive-suggestions.tsx` idag, men körd server-side mot användarens `tasks` i localStorage → jag flyttar loop-trigger till en enkel `task_reminders`-tabell så servern kan schemalägga notisen när uppgiften skapas.
- **Väder-plats**: lagras i `push_preferences.last_location` när weather-card hämtar den.
- **Deduplicering**: `push_deliveries`-tabell så samma notis inte skickas två gånger.

## Vad du behöver göra själv

1. Installera MyFlove på hemskärmen (iPhone: Dela → Lägg till på hemskärmen).
2. Tryck "Aktivera notiser" i appen och godkänn.
3. Klart – ingen tredjepartstjänst, inga extra konton.

## Vad jag INTE gör i den här omgången

- Native iOS/Android-app via Capacitor (separat projekt).
- Push till Apple Watch / Wear OS.
- Custom notis-ljud (browser bestämmer ljudet i bakgrunden).
- SMS/e-post-fallback.

Vill du att jag kör igång?

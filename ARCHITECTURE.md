# MyFlove — Architecture

MyFlove är en svenskspråkig "lugnt livsflöde"-app (fokus, uppgifter, humör, ekonomi, resor, familj m.m.) byggd som en TanStack Start-app med Supabase som backend. Detta dokument beskriver hur systemet hänger ihop.

> **Viktigt om autentisering:** Appen använder **Supabase Auth** — inte Clerk. `src/compat/clerk.tsx` är enbart ett _shim_ som exponerar Clerk-liknande API:er (`useUser`, `useClerk`, `SignedIn`/`SignedOut`) ovanpå `supabase.auth`. Det finns inget Clerk-beroende i körtid. Äldre dokumentation (inkl. `CLAUDE.md`) som talar om "Clerk för autentisering" syftar i praktiken på detta shim-lager.

## 1. Tech Stack & Beroenden

| Kategori                         | Teknologi                                                                                                    | Varför                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                        | **TanStack Start** (`@tanstack/react-start`) + **TanStack Router**                                           | Fullstack React-ramverk med filbaserad routing, SSR och server-funktioner (`.server.ts`), ersätter Next.js i detta projekt.                                 |
| UI-bibliotek                     | **React 19**                                                                                                 | Komponentmodell, concurrent rendering.                                                                                                                      |
| Byggverktyg                      | **Vite 8** (`@lovable.dev/vite-tanstack-config`)                                                             | Snabb dev-server/HMR och produktionsbygge; projektets Lovable-preset lindrar in TanStack Start, React-plugin, path-alias m.m.                               |
| Språk                            | **TypeScript 5**                                                                                             | Typsäkerhet över hela kodbasen, inkl. Supabase-genererade typer.                                                                                            |
| Styling                          | **Tailwind CSS 4** (`@tailwindcss/vite`) + `tailwind-merge`, `class-variance-authority`                      | Utility-first CSS med temavariabler (HSL custom properties) för färgteman per sida/kategori.                                                                |
| UI-komponenter                   | **Radix UI**-primitiver (dialog, dropdown, tabs, osv.) inpackade i `src/components/ui/*` (shadcn/ui-mönster) | Tillgängliga, ostylade primitiver som stylas med Tailwind — konsekvent design-system.                                                                       |
| Ikoner                           | `lucide-react`, `react-icons`                                                                                | Ikonuppsättning för navigation och UI.                                                                                                                      |
| State/data-fetching              | **TanStack Query** (`@tanstack/react-query`)                                                                 | Cache/async state för server-data; `QueryClient` skapas i routern och delas via router-context.                                                             |
| Formulär                         | `react-hook-form` + `@hookform/resolvers` + `zod`                                                            | Formulärhantering med schemavalidering.                                                                                                                     |
| Backend-as-a-service             | **Supabase** (`@supabase/supabase-js`)                                                                       | Postgres-databas med Row Level Security, auth, nyckel/värde-lagring (`user_kv`) och migrationer i `supabase/migrations/`.                                   |
| Autentisering                    | **Supabase Auth**, exponerat via ett Clerk-kompatibelt shim (`src/compat/clerk.tsx`)                         | Inloggning/registrering, sessionshantering och JWT. Shimmet ger `useUser()`/`useClerk()`-API:er så att komponentkoden slipper känna till Supabase-detaljer. |
| Klientnavigering (komponentnivå) | **wouter** (via `src/compat/wouter.tsx`)                                                                     | Lättviktig `<Link>`/`useLocation`-API som används inuti komponenter (t.ex. `Layout`), ovanpå TanStack Routers faktiska route-träd.                          |
| AI                               | `ai` (Vercel AI SDK) + `@ai-sdk/openai-compatible`, `@ai-sdk/react`                                          | Chatt-/assistentfunktioner (Flow-assistenten) och MCP-verktygsanrop.                                                                                        |
| MCP                              | `@lovable.dev/mcp-js`                                                                                        | Exponerar/ansluter Model Context Protocol-verktyg (se `src/lib/mcp/`), avstängt på Windows i dev pga path-separator-bugg.                                   |
| Mobil                            | Capacitor (`@capacitor/android`, `@capacitor/ios`, m.fl.)                                                    | Paketering av webbappen som native iOS/Android-app.                                                                                                         |
| Push-notiser                     | `@block65/webcrypto-web-push`                                                                                | Web Push-notifikationer server-side.                                                                                                                        |
| Diagram/övrigt                   | `recharts`, `embla-carousel-react`, `framer-motion`, `date-fns`, `cmdk`, `sonner`, `vaul`                    | Statistik-diagram, karuseller, animationer, datumhantering, kommandopalett, toasts, drawers.                                                                |
| Kvalitet                         | ESLint 9 + `typescript-eslint`, Prettier                                                                     | Lint och formattering.                                                                                                                                      |

## 2. Katalogstruktur

```
.
├── public/                # Statiska filer (manifest, ikoner, service worker-assets)
├── remotion/              # Videogenerering (marknadsföringsmaterial), fristående från appen
├── supabase/
│   ├── config.toml        # Supabase-projektkonfiguration
│   └── migrations/        # SQL-migrationer (schema, RLS-policies, triggers) — sanningskälla för DB
└── src/
    ├── compat/            # Kompatibilitetsskikt: wouter-, Clerk- och api-client-shims
    ├── components/
    │   ├── ui/            # Generiska, återanvändbara UI-primitiver (shadcn/Radix-baserade)
    │   └── *.tsx          # Appspecifika komponenter (layout, modaler, widgets)
    ├── hooks/             # Delad React-logik (state, alerts, sync) frikopplad från UI
    ├── integrations/
    │   └── supabase/      # Supabase-klient (browser/server), auth-middleware, genererade DB-typer
    ├── lib/               # "Ren" logik: domänfunktioner, server-funktioner, AI, analytics, push
    │   └── mcp/           # MCP-serververktyg (add-task, list-tasks, log-mood osv.)
    ├── pages/             # Sidkomponenter (presentation) — importeras av routes/
    ├── routes/            # TanStack Start filbaserad routing — varje .tsx/.ts = en URL
    │   ├── _app.*.tsx     # Skyddade appsidor under layout-routen `_app`
    │   ├── api/public/    # Publika HTTP-endpoints utan auth (t.ex. csp-report)
    │   ├── [.mcp]/        # MCP-endpoints (list-tools, invoke-tool) — autogenererade
    │   └── [.well-known]/ # OAuth-metadata för MCP-klienter
    ├── router.tsx         # Router-fabrik (skapar QueryClient + TanStack Router-instans)
    ├── routeTree.gen.ts   # Auto-genererat routträd — redigeras aldrig manuellt
    ├── server.ts / start.ts # Server-entrypoints för SSR
    └── styles.css         # Globala Tailwind-stilar + temavariabler
```

### Ansvar per mapp

- **`components/`** – Presentationsnära, återanvändbara React-komponenter. `ui/` innehåller "dumma" designsystem-primitiver (Button, Dialog, Card osv.) utan appspecifik logik. Övriga filer (t.ex. `layout.tsx`, `flow-insights-modal.tsx`) är appspecifika komponenter som kombinerar UI-primitiver med hooks.
- **`pages/`** – En komponent per funktionsyta (t.ex. `dashboard.tsx`, `mood.tsx`, `finances.tsx`). Dessa importeras och renderas av motsvarande fil i `routes/`, vilket separerar _route-definition_ (URL, guards, SSR-läge) från _sidinnehåll_.
- **`routes/`** – TanStack Starts filbaserade routingträd. `__root.tsx` är app-skalet (HTML-dokument, meta-taggar, globala providers). `_app.tsx` är en layout-route (`ssr: false`) vars `beforeLoad` läser Supabase-sessionen och redirectar till `/sign-in` om ingen finns — detta är en **UX-guard, inte en säkerhetsgräns** (se avsnitt 6). Varje `_app.<namn>.tsx`-fil motsvarar en sida bakom den guarden (kalender, ekonomi, familj m.m.); `[.mcp]/` och `[.well-known]/` exponerar MCP-/OAuth-relaterade API-endpoints, och `api/public/` publika endpoints utan auth.
- **`hooks/`** – Återanvändbar stateful logik frikopplad från rendering: t.ex. `use-data.ts` (domän-hooks för tasks/reminders/moods/etc.), `use-commute-alerts.ts`, `use-notification-scheduler.ts`, `use-is-admin.ts`. Hooks kombinerar ofta `lib/`-funktioner med lokal React-state.
- **`lib/`** – Ren logik och integrationer utan JSX: domänhjälpare (`achievements.ts`, `mood-stats.ts`, `battery-load-trend.ts`), lagring (`storage.ts`, `cloud-storage.ts`), AI (`ai-assistant.ts`, `ai-gateway.server.ts`, `flow-chat.functions.ts`), kalenderkoppling (`calendar-connect.functions.ts`), push (`push.server.ts`, `push-notifications.ts`) och analytics (`analytics.ts`/`.functions.ts`). Filer med suffixet `.functions.ts` eller `.server.ts` körs (delvis) på servern som TanStack Start server-funktioner.
- **`integrations/supabase/`** – Genererad/central plats för Supabase-klienten: `client.ts` (browser, lazy-init via `Proxy`), `client.server.ts` (server), `types.ts` (auto-genererade databastyper), `auth-middleware.ts` (server-middleware `requireSupabaseAuth` som verifierar användarens JWT via `supabase.auth.getClaims()` och skapar en RLS-scopad klient), `auth-attacher.ts` (bifogar access-token till utgående server-funktionsanrop).
- **`compat/`** – Tunna shim-lager så att koden kan importera bekanta API:er (`wouter`, `@clerk/react`, en intern API-klient) trots att den faktiska implementationen skiljer sig: TanStack Router under huven och **Supabase Auth** bakom Clerk-API:et.

## 3. Dataflöde & State Management

MyFlove har tre parallella state-lager, valda efter datans känslighet/delningsbehov:

1. **Lokal komponent-state** (`useState`/`useMemo`) — tillfälligt UI-state som mobilmeny, redigeringsläge för bottennav (`layout.tsx`).
2. **`localStorage`-backad state** (`lib/storage.ts` → `useLocalStorage`) — persisterar per enhet (t.ex. shoppinglista, humörloggar, ekonomitransaktioner). Synkas mellan flikar/komponenter via ett custom `myflow-local-storage`-event samt native `storage`-eventet.
3. **Molnsynkad state** (`lib/cloud-storage.ts` → `useCloudSyncedStorage`) — `localStorage` är sanningskällan på enheten; varje nyckel synkas till `user_kv`. Varje synk läser först molnets senaste version, gör en trevägssammanslagning mot senast bekräftade bas (`lib/sync-merge.ts`) och skriver villkorat på `updated_at` (krock → läs om). Debounce 600 ms på modulnivå, så att en stängd dialog inte tappar sin ändring. Misslyckade skrivningar markeras aldrig som bekräftade och försöks igen (5 s/15 s/60 s, vid `online` och när appen kommer i förgrunden). Synkläget visas diskret i `components/sync-status-note.tsx`.

**Server-/nätverksdata:**

- **Supabase** (`integrations/supabase/client.ts`) är huvudkällan för persistent, delad data (t.ex. `user_kv`, admin-statistik, familjedata). Klienten skapas lazy via en `Proxy` så miljövariabler först behöver läsas vid första anropet (fungerar för både klient- och SSR-kontext via `import.meta.env`/`process.env`).
- **TanStack Query** (`QueryClient`, instansierad i `router.tsx` och delad via routerns `context`) hanterar cache, refetch och laddningsstate för asynkrona anrop, exponerad genom `QueryClientProvider` i `routes/__root.tsx`.
- **Server-funktioner** (filer med `.functions.ts`/`.server.ts` i `lib/`) körs på servern (TanStack Start) för saker som kräver hemligheter eller backend-åtkomst: AI-anrop (`ai-gateway.server.ts`), push (`push.server.ts`), admin-, konto- och analysfunktioner.
- **Domän-hooks** i `hooks/use-data.ts` (t.ex. `useTasks`, `useReminders`, `useMedications`, `useFinances`) kapslar in all CRUD-logik för respektive datatyp och exponerar ett rent API till sidkomponenterna — sidorna själva innehåller ingen persistenslogik.

Flöde i praktik: **Sida (`pages/*.tsx`) → domän-hook (`hooks/use-data.ts` m.fl.) → `useLocalStorage`/`useCloudSyncedStorage` → `localStorage` + Supabase (`user_kv`)**, med `trackEvent` (från `lib/analytics.ts`) anropat vid nyckelinteraktioner för produktanalys.

## 4. Routing & Komponenter

- **Filbaserad routing** via TanStack Router/Start: varje fil i `src/routes/` blir en URL (se `src/routes/README.md` för konventionerna: `index.tsx` → `/`, `$id.tsx` → dynamisk param, `_layout.tsx` → layout-route, `__root.tsx` → app-skal). `routeTree.gen.ts` genereras automatiskt av router-pluginet och ska aldrig redigeras manuellt.
- **`__root.tsx`** sätter upp HTML-dokumentet (meta-taggar, fonter, manifest), globala providers (`QueryClientProvider`, `TooltipProvider`) och globala toasts (`Toaster`, `Sonner`).
- **`_app.tsx`** är app-layoutrouten: `beforeLoad` kontrollerar Supabase-sessionen och redirectar oautentiserade användare till `/sign-in`; alla appens huvudsidor (`_app.hem.tsx`, `_app.kalender.tsx`, `_app.finances.tsx`, osv.) ligger under detta prefix och renderas via `<Outlet />`. Eftersom routen är `ssr: false` körs kontrollen i webbläsaren mot den lokalt lagrade sessionen — den skyddar vyer, inte data.
- Route-filerna är tunna — de importerar och renderar motsvarande komponent i `pages/` (separation mellan _routing/guards_ och _sidinnehåll_).
- **`components/layout.tsx`** är den centrala UI-skalkomponenten för inloggade sidor: sido-/bottennavigering (med användarbara, anpassningsbara snabbval), sidspecifika färgteman (`CATEGORY_THEMES`, via CSS custom properties för `--primary`/`--accent`), globala varningsbanners (pendel-, medicin- och närhetsalarm) samt inloggnings-/utloggningskontroller via Clerk.
- Intern länknavigering inuti komponenter använder `wouter`s `<Link>`/`useLocation` (via kompatibilitetslagret `src/compat/wouter.tsx`) snarare än TanStack Routers egna primitiver — ett medvetet abstraktionslager ovanpå det faktiska routträdet.
- **Centrala komponenter:** `Layout` (navigationsskal), `components/ui/*` (designsystem: `Button`, `Dialog`, `Card`, `Sidebar`, `Chart` osv.), samt funktionsspecifika modaler (`flow-insights-modal.tsx`, `help-me-modal.tsx`, `stop-modal.tsx`, `overwhelmed-modal.tsx`) och widgets (`widget-grid.tsx`, `weather-card.tsx`, `home-shortcuts.tsx`) som används på dashboard/hem-sidan.

## 5. Viktiga designmönster

- **UI vs. logik-separation:** `components/ui/` innehåller enbart presentationslogik (shadcn/Radix-mönster); all domänlogik ligger i `hooks/` och `lib/`. Sidkomponenter i `pages/` komponerar ihop UI-komponenter och hooks utan att själva innehålla persistens- eller nätverkslogik.
- **Route vs. page-separation:** `routes/*.tsx` hanterar enbart URL, guards (`beforeLoad`) och SSR-inställningar (`ssr: false` där relevant); faktiskt sidinnehåll delegeras alltid till en komponent i `pages/`.
- **Progressiv datalagring (offline-first → cloud-sync):** `useLocalStorage` är basbyggstenen; `useCloudSyncedStorage` lägger till molnsynk ovanpå den utan att byta API, så komponenter som redan använder mönstret kan uppgraderas transparent (se kommentaren i `hooks/use-data.ts` om att lokal `shopping`-lista fungerar som fallback för den delade, hushållsbaserade listan).
- **Kompatibilitetslager (`compat/`):** Externa/tredjeparts-API:er (wouter, Clerk) wrappas i tunna adaptrar så att resten av appen kan koda mot ett stabilt, bekant interface oavsett underliggande implementation — gör det enklare att byta ut infrastruktur senare.
- **Server-/klient-uppdelning via filnamnskonvention:** `.server.ts` och `.functions.ts`-suffix signalerar kod som körs (delvis) på servern (hemligheter, betrodda anrop), medan resten av `lib/` är delad/klientsäker logik.
- **Temastyrning via CSS custom properties:** Varje sidkategori har ett eget färgtema (`T.terracotta`, `T.sage`, `T.gold`, `T.ink` i `layout.tsx`) som injiceras som inline CSS-variabler (`--primary`, `--accent`, `--ring`), vilket låter Tailwind-klasser som `bg-primary`/`text-primary` automatiskt återspegla rätt tema per sida utan duplicerad styling.
- **Lazy/proxy-initiering av externa klienter:** Supabase-klienten skapas först vid första faktiska användningen via en `Proxy` (`integrations/supabase/client.ts`), vilket undviker krascher vid modul-import om miljövariabler saknas i vissa körningskontexter (t.ex. byggtid).
- **Plattformsmedvetna byggverktyg:** `vite.config.ts` stänger av MCP-Vite-pluginet på Windows (`process.platform !== "win32"`) eftersom det kraschar på path-separatorer där, men behåller det aktivt för Linux/macOS-utvecklare — ett exempel på miljöspecifik konfiguration utan att bryta funktionalitet för andra plattformar.

## 6. Säkerhetsmodell

Säkerheten vilar på **tre lager**. Det är viktigt att förstå vad varje lager faktiskt skyddar, eftersom det är lätt att övertolka route-guarden.

| Lager                 | Var                                                                | Vad det skyddar                                                                                                                                                                       | Vad det _inte_ skyddar                                                                                                      |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1. Route-guard        | `routes/_app.tsx` (`beforeLoad`)                                   | Att inloggade vyer inte renderas för utloggade användare. Ren UX.                                                                                                                     | Ingenting datamässigt — routen är `ssr: false` och sessionen läses från `localStorage`, vilket en användare kan manipulera. |
| 2. Row Level Security | `supabase/migrations/*.sql`                                        | Den faktiska datagränsen. Varje användartabell har `ENABLE ROW LEVEL SECURITY` med policies som matchar `auth.uid() = user_id` (se `user_kv`).                                        | Data som nås via service-role-nyckeln (lager 3).                                                                            |
| 3. Server-funktioner  | `requireSupabaseAuth` i `integrations/supabase/auth-middleware.ts` | Betrodda operationer. Middlewaret kräver `Authorization: Bearer <jwt>`, verifierar token med `supabase.auth.getClaims()` och exponerar `userId`/`claims`/RLS-scopad klient i context. | Inget om en server-funktion glömmer att lägga till middlewaret.                                                             |

**Regler att följa:**

- **RLS är sanningskällan.** Varje ny tabell måste ha RLS aktiverat _och_ explicita policies i samma migration. En tabell utan policies är antingen helt låst eller helt öppen — båda är buggar.
- **Service-role-nyckeln får aldrig nå klienten.** `integrations/supabase/client.server.ts` (`supabaseAdmin`) kringgår RLS och får endast importeras **dynamiskt inuti** en server-funktions handler, aldrig på toppnivå i en fil som kan bundlas till klienten.
- **Behörighetskontroll före privilegierad åtkomst.** Mönstret i `lib/admin.functions.ts` är normen: `requireSupabaseAuth` → `assertAdmin()` mot den RLS-scopade klienten → _först därefter_ `supabaseAdmin`. Klient-hooken `useIsAdmin()` styr endast om menyval visas och är inte en behörighetskontroll.
- **Publika endpoints ska vara medvetet publika.** Allt under `routes/api/public/` saknar auth (t.ex. `csp-report.ts`). Lägg inte något där som läser eller skriver användardata.
- **CSP-rapportering:** Browsern postar policy-överträdelser till `/api/public/csp-report`, som loggar dem till serverloggen. Endpointen är oautentiserad och saknar rate limiting — den bör betraktas som best-effort telemetri, inte som en tillförlitlig signal.

### Kända säkerhetsrisker

- **Lokal kryptering (`lib/secure-local.ts`).** Energi, mående, medicin och ekonomi skrivs AES-GCM-krypterat till `localStorage`; nyckeln är en icke-exporterbar CryptoKey i IndexedDB som skapas atomärt i en readwrite-transaktion (flikar som startar samtidigt får samma nyckel). Innan nyckeln är redo hålls skrivningar i minnet; går IndexedDB inte att använda skrivs aldrig klartext – värdet stannar i minnet och användaren får ett besked. Skyddet gäller lagrad data (kopierade filer, backup); det skyddar **inte** mot skadlig kod i samma origin, som kan använda nyckeln via WebCrypto.
- **Kontoseparering (`lib/account-scope.ts`).** Lokal data ägs alltid av ett konto (`myflove-data-owner`). Synk och energimigrering körs bara när ägaren är den inloggade användaren. Utloggning (`lib/local-data.ts`): sista flush, bekräftad data raderas, osynkad flyttas till kontots förråd `myflove-stash:<userId>:*`. Inloggning som ett annat konto flyttar undan aktiv data och lägger tillbaka det kontots förråd, följt av omladdning. Ägarlös data från äldre versioner adopteras bara av en redan inloggad session vid start; annars läggs den i förrådet `unowned` och visas/synkas inte. Utgången session (SIGNED_OUT utan utloggning) parkerar allt hos ägaren.
- **Miljövariabler:** endast `VITE_`-prefixade variabler får innehålla publika värden — de bakas in i klientbundlen. Serverhemligheter (AI-gateway-nyckel, service role, VAPID-nycklar) läses via `process.env` i `.server.ts`/`.functions.ts`.

## 7. Felhantering

- **Serverfel:** `lib/error-capture.ts` fångar `error`/`unhandledrejection` globalt och sparar det senaste felet i ~5 sekunder, så att `server.ts` kan återskapa den ursprungliga stacken när h3 redan har svalt kastet till ett generiskt 500-svar. `lib/error-page.ts` renderar felsidan.
- **Klientfel:** `lib/lovable-error-reporting.ts` rapporterar körningsfel; `sonner`-toasts (`Toaster` i `__root.tsx`) används för användarvänliga felmeddelanden.
- **Datalager:** all `localStorage`-åtkomst är inkapslad i `try/catch` (privat läge och kvotfel får inte krascha appen). Molnsynk är avsiktligt best-effort — ett misslyckat Supabase-anrop loggas men blockerar aldrig UI:t.
- **Att förbättra:** flera `catch`-block sväljer fel tyst (`catch { /* ignore */ }`). Vid nya sådana bör felet minst loggas, annars blir synkbuggar osynliga. Det finns inte heller någon React error boundary per sida — ett renderingsfel i en widget kan därför fälla hela vyn.

## 8. Prestanda

- **SSR av/på per route:** flera appsidor sätter `ssr: false` eftersom deras data ändå ligger i `localStorage`. Det ger snabbare TTFB men innebär att sidan visar tom skärm tills JS laddats — undvik att sätta `ssr: false` på publika marknadsföringssidor där SEO spelar roll.
- **TanStack Query** hanterar cache och deduplicering av nätverksanrop; sätt `staleTime` medvetet i stället för att förlita sig på default (0), som annars refetchar vid varje fokusbyte.
- **Molnsynk är debouncead (600 ms)** och skriver hela värdet för en nyckel som en JSON-blob. För stora listor (uppgifter, transaktioner) växer varje skrivning linjärt med datamängden — nycklar med mycket data bör på sikt flyttas till egna tabeller med radnivåuppdateringar i stället för `user_kv`.
- **Kända flaskhalsar:** `useCloudSyncedStorage` läser molnet före varje skrivning (ett extra anrop per synk); `layout.tsx` monterar flera globala alarm-hooks (pendling, medicin, närhet) på varje sida oavsett om sidan behöver dem.
- **Bundlestorlek:** `recharts`, `framer-motion` och Remotion-relaterat är tunga. Sidor som bara ibland behöver diagram bör lazy-loada dem via `React.lazy`.

## 9. Testning

Projektet använder Vitest för enhetstester och Playwright-skript för riktade visuella kontroller. Kvalitetssäkringen kompletteras med TypeScript, ESLint och produktionsbygge.

Kommandon som finns idag:

```bash
npm run dev      # Dev-server
npm run build    # Produktionsbygge
npm run lint     # ESLint
npm run format   # Prettier
npm run test     # Vitest
npx tsc --noEmit # Typkontroll (inget npm-script finns)
```

Rekommenderad fortsatt testordning:

1. **Enhetstester (Vitest)** för `lib/` — ren logik utan JSX (`achievements.ts`, `mood-stats.ts`, `battery-load-trend.ts`, `flowscore.ts`) ger mest värde per insats.
2. **Hook-tester** för `useLocalStorage`/`useCloudSyncedStorage` — synk och last-write-wins är den mest buggkänsliga delen av appen.
3. **RLS-tester** mot en lokal Supabase-instans: verifiera att användare A inte kan läsa användare B:s rader. Detta är den enda kontroll som faktiskt skyddar data.
4. **E2E (Playwright)** för de kritiska flödena: inloggning, skapa uppgift, logga humör, utloggning.

Behåll testerna nära berörd logik och kör hela Vitest-sviten inför release.

## 10. Kända begränsningar & teknisk skuld

| Område                   | Problem                                                                                                                                  | Möjlig åtgärd                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Synkkonflikter           | Trevägssammanslagning per post: nya poster behålls, borttagning vinner, ändring på en sida gäller, ändring på båda → senaste ändringen av nyckeln vinner (enhetsklockor kan skilja). Övriga värden: senaste vinner. | Per-post-tidsstämplar om fältvisa konflikter blir ett problem. |
| `user_kv` som datamodell | Hela domänen lagras som JSON-blobbar, vilket omöjliggör frågor, index och partiella uppdateringar på serversidan.                        | Flytta datatunga domäner (uppgifter, transaktioner) till riktiga tabeller. |
| Två routingsystem        | `wouter`-shimmet ovanpå TanStack Router betyder att prefetch, typade länkar och `beforeLoad`-integration går förlorade i komponentkoden. | Migrera successivt till TanStack Routers `<Link>`.                         |
| Clerk-shimmet            | Namnet antyder ett beroende som inte finns och missleder både utvecklare och dokumentation.                                              | Byt namn till t.ex. `compat/auth.tsx` och uppdatera `CLAUDE.md`.           |
| Utloggning               | Lokal data rensas inte.                                                                                                                  | Rensa app-nycklar på `SIGNED_OUT`.                                         |
| Testtäckning             | Kritiska flöden har ännu inte fullständig E2E-täckning.                                                                                  | Utöka Playwright-sviten stegvis.                                           |
| MCP på Windows           | Pluginet är avstängt i dev på Windows, så MCP-endpoints kan inte testas lokalt där.                                                      | Dokumentera arbetsflödet, eller kör via WSL.                               |

# MyFlove — Architecture

MyFlove är en svenskspråkig "lugnt livsflöde"-app (fokus, uppgifter, humör, ekonomi, resor, familj m.m.) byggd som en TanStack Start-app med Supabase som backend och Clerk för autentisering. Detta dokument beskriver hur systemet hänger ihop.

## 1. Tech Stack & Beroenden

| Kategori | Teknologi | Varför |
| --- | --- | --- |
| Framework | **TanStack Start** (`@tanstack/react-start`) + **TanStack Router** | Fullstack React-ramverk med filbaserad routing, SSR och server-funktioner (`.server.ts`), ersätter Next.js i detta projekt. |
| UI-bibliotek | **React 19** | Komponentmodell, concurrent rendering. |
| Byggverktyg | **Vite 8** (`@lovable.dev/vite-tanstack-config`) | Snabb dev-server/HMR och produktionsbygge; projektets Lovable-preset lindrar in TanStack Start, React-plugin, path-alias m.m. |
| Språk | **TypeScript 5** | Typsäkerhet över hela kodbasen, inkl. Supabase-genererade typer. |
| Styling | **Tailwind CSS 4** (`@tailwindcss/vite`) + `tailwind-merge`, `class-variance-authority` | Utility-first CSS med temavariabler (HSL custom properties) för färgteman per sida/kategori. |
| UI-komponenter | **Radix UI**-primitiver (dialog, dropdown, tabs, osv.) inpackade i `src/components/ui/*` (shadcn/ui-mönster) | Tillgängliga, ostylade primitiver som stylas med Tailwind — konsekvent design-system. |
| Ikoner | `lucide-react`, `react-icons` | Ikonuppsättning för navigation och UI. |
| State/data-fetching | **TanStack Query** (`@tanstack/react-query`) | Cache/async state för server-data; `QueryClient` skapas i routern och delas via router-context. |
| Formulär | `react-hook-form` + `@hookform/resolvers` + `zod` | Formulärhantering med schemavalidering. |
| Backend-as-a-service | **Supabase** (`@supabase/supabase-js`) | Postgres-databas, auth-adjacent lagring (`user_kv`), edge functions/serverless-anrop för AI, push, m.m. |
| Autentisering | **Clerk** (via kompatibilitetslager, se `src/compat/clerk.tsx`) | Inloggning/registrering; `useClerk()`/`Show` styr UI baserat på inloggningsstatus. |
| Klientnavigering (komponentnivå) | **wouter** (via `src/compat/wouter.tsx`) | Lättviktig `<Link>`/`useLocation`-API som används inuti komponenter (t.ex. `Layout`), ovanpå TanStack Routers faktiska route-träd. |
| AI | `ai` (Vercel AI SDK) + `@ai-sdk/openai-compatible`, `@ai-sdk/react` | Chatt-/assistentfunktioner (Flow-assistenten) och MCP-verktygsanrop. |
| MCP | `@lovable.dev/mcp-js` | Exponerar/ansluter Model Context Protocol-verktyg (se `src/lib/mcp/`), avstängt på Windows i dev pga path-separator-bugg. |
| Mobil | Capacitor (`@capacitor/android`, `@capacitor/ios`, m.fl.) | Paketering av webbappen som native iOS/Android-app. |
| Push-notiser | `@block65/webcrypto-web-push` | Web Push-notifikationer server-side. |
| Diagram/övrigt | `recharts`, `embla-carousel-react`, `framer-motion`, `date-fns`, `cmdk`, `sonner`, `vaul` | Statistik-diagram, karuseller, animationer, datumhantering, kommandopalett, toasts, drawers. |
| Kvalitet | ESLint 9 + `typescript-eslint`, Prettier | Lint och formattering. |

## 2. Katalogstruktur

```
src/
├── compat/               # Kompatibilitetsskikt: wouter-, Clerk- och api-client-shims
├── components/
│   ├── ui/                # Generiska, återanvändbara UI-primitiver (shadcn/Radix-baserade)
│   └── *.tsx               # Appspecifika komponenter (layout, modaler, widgets)
├── hooks/                 # Delad React-logik (state, alerts, sync) frikopplad från UI
├── integrations/
│   └── supabase/           # Supabase-klient (browser/server), auth-middleware, genererade DB-typer
├── lib/                   # "Ren" logik: domänfunktioner, server-funktioner (.functions.ts), AI, analytics, push
│   └── mcp/                 # MCP-serververktyg (add-task, list-tasks, log-mood osv.)
├── pages/                 # Sidkomponenter (presentation) — en per funktionsyta, importeras av routes/
├── routes/                # TanStack Start filbaserad routing — varje .tsx/.ts = en URL
├── router.tsx             # Router-fabrik (skapar QueryClient + TanStack Router-instans)
├── routeTree.gen.ts       # Auto-genererat routträd — redigeras aldrig manuellt
├── server.ts / start.ts   # Server-entrypoints för SSR
└── styles.css             # Globala Tailwind-stilar + temavariabler
```

### Ansvar per mapp

- **`components/`** – Presentationsnära, återanvändbara React-komponenter. `ui/` innehåller "dumma" designsystem-primitiver (Button, Dialog, Card osv.) utan appspecifik logik. Övriga filer (t.ex. `layout.tsx`, `flow-insights-modal.tsx`) är appspecifika komponenter som kombinerar UI-primitiver med hooks.
- **`pages/`** – En komponent per funktionsyta (t.ex. `dashboard.tsx`, `mood.tsx`, `finances.tsx`). Dessa importeras och renderas av motsvarande fil i `routes/`, vilket separerar *route-definition* (URL, guards, SSR-läge) från *sidinnehåll*.
- **`routes/`** – TanStack Starts filbaserade routingträd. `__root.tsx` är app-skalet (HTML-dokument, meta-taggar, globala providers). `_app.tsx` är en layout-route som skyddar allt under `/_app.*` med en `beforeLoad`-session-check mot Supabase och redirectar till `/sign-in` om ingen session finns. Varje `_app.<namn>.tsx`-fil motsvarar en skyddad sida (kalender, ekonomi, familj m.m.); `[.mcp]/` och `[.well-known]/` exponerar MCP-/OAuth-relaterade API-endpoints.
- **`hooks/`** – Återanvändbar stateful logik frikopplad från rendering: t.ex. `use-data.ts` (domän-hooks för tasks/reminders/moods/etc.), `use-commute-alerts.ts`, `use-notification-scheduler.ts`, `use-is-admin.ts`. Hooks kombinerar ofta `lib/`-funktioner med lokal React-state.
- **`lib/`** – Ren logik och integrationer utan JSX: domänhjälpare (`achievements.ts`, `mood-stats.ts`, `ics.ts`), lagring (`storage.ts`, `cloud-storage.ts`), AI (`ai-assistant.ts`, `ai-gateway.server.ts`, `flow-chat.functions.ts`), push (`push.server.ts`, `push-notifications.ts`), analytics (`analytics.ts`/`.functions.ts`) och MCP-verktyg (`mcp/`). Filer med suffixet `.functions.ts` eller `.server.ts` körs (delvis) på servern som TanStack Start server-funktioner.
- **`integrations/supabase/`** – Genererad/central plats för Supabase-klienten: `client.ts` (browser, lazy-init via `Proxy`), `client.server.ts` (server), `types.ts` (auto-genererade databastyper), `auth-middleware.ts`/`auth-attacher.ts` (kopplar Clerk-session till Supabase-anrop).
- **`compat/`** – Tunna shim-lager så att koden kan importera bekanta API:er (`wouter`, `@clerk/react`, en intern API-klient) trots att den faktiska implementationen skiljer sig (TanStack Router under huven, Lovable-specifik auth osv.).

## 3. Dataflöde & State Management

MyFlove har tre parallella state-lager, valda efter datans känslighet/delningsbehov:

1. **Lokal komponent-state** (`useState`/`useMemo`) — tillfälligt UI-state som mobilmeny, redigeringsläge för bottennav (`layout.tsx`).
2. **`localStorage`-backad state** (`lib/storage.ts` → `useLocalStorage`) — persisterar per enhet (t.ex. shoppinglista, humörloggar, ekonomitransaktioner). Synkas mellan flikar/komponenter via ett custom `myflow-local-storage`-event samt native `storage`-eventet.
3. **Molnsynkad state** (`lib/cloud-storage.ts` → `useCloudSyncedStorage`) — bygger ovanpå `useLocalStorage` men pushar/hämtar också värdet till/från Supabase-tabellen `user_kv` (per `user_id` + `key`), med "last-write-wins" baserat på en lokalt sparad `updated_at`-tidsstämpel. Appen fungerar offline-first: `localStorage` är sanningskällan, molnet är best-effort och debouncead (600 ms) vid skrivning. Används för data som ska följa användaren mellan enheter, t.ex. `tasks` och `reminders` (se `hooks/use-data.ts`).

**Server-/nätverksdata:**
- **Supabase** (`integrations/supabase/client.ts`) är huvudkällan för persistent, delad data (t.ex. `user_kv`, admin-statistik, familjedata). Klienten skapas lazy via en `Proxy` så miljövariabler först behöver läsas vid första anropet (fungerar för både klient- och SSR-kontext via `import.meta.env`/`process.env`).
- **TanStack Query** (`QueryClient`, instansierad i `router.tsx` och delad via routerns `context`) hanterar cache, refetch och laddningsstate för asynkrona anrop, exponerad genom `QueryClientProvider` i `routes/__root.tsx`.
- **Server-funktioner** (filer med `.functions.ts`/`.server.ts` i `lib/`) körs på servern (TanStack Start) för saker som kräver hemligheter eller backend-åtkomst: AI-anrop (`ai-gateway.server.ts`), push (`push.server.ts`), admin-, konto- och analysfunktioner.
- **Domän-hooks** i `hooks/use-data.ts` (t.ex. `useTasks`, `useReminders`, `useMedications`, `useFinances`) kapslar in all CRUD-logik för respektive datatyp och exponerar ett rent API till sidkomponenterna — sidorna själva innehåller ingen persistenslogik.

Flöde i praktik: **Sida (`pages/*.tsx`) → domän-hook (`hooks/use-data.ts` m.fl.) → `useLocalStorage`/`useCloudSyncedStorage` → `localStorage` + Supabase (`user_kv`)**, med `trackEvent` (från `lib/analytics.ts`) anropat vid nyckelinteraktioner för produktanalys.

## 4. Routing & Komponenter

- **Filbaserad routing** via TanStack Router/Start: varje fil i `src/routes/` blir en URL (se `src/routes/README.md` för konventionerna: `index.tsx` → `/`, `$id.tsx` → dynamisk param, `_layout.tsx` → layout-route, `__root.tsx` → app-skal). `routeTree.gen.ts` genereras automatiskt av router-pluginet och ska aldrig redigeras manuellt.
- **`__root.tsx`** sätter upp HTML-dokumentet (meta-taggar, fonter, manifest), globala providers (`QueryClientProvider`, `TooltipProvider`) och globala toasts (`Toaster`, `Sonner`).
- **`_app.tsx`** är en skyddad layout-route: `beforeLoad` kontrollerar Supabase-sessionen och redirectar oautentiserade användare till `/sign-in`; alla appens huvudsidor (`_app.hem.tsx`, `_app.kalender.tsx`, `_app.finances.tsx`, osv.) ligger under detta prefix och renderas via `<Outlet />`.
- Route-filerna är tunna — de importerar och renderar motsvarande komponent i `pages/` (separation mellan *routing/guards* och *sidinnehåll*).
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

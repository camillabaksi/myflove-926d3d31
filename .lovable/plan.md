# Helhetsrevision av MyFlove (read-only audit)

Inget är ändrat. Nedan är resultatet av en genomgång av navigation, sidor, datamodell, lagring, statistik och designsystem.

## 1. Vad som är bra och ska behållas

- **Blockssystemet**: `MyFloveBlock`, `ExpandableBlock`, `MyFlovePageGrid` (src/components/myflove/block.tsx) är ett väl dokumenterat, enda avsett kortmönster. Home, Idag/Kalender (day-hub), Mitt batteri, Hälsa, Anpassa, Flow och QuickFlow följer det korrekt.
- **Legacy-routes är redan sanerade**: `/min-dag`, `/vad-nu`, `/calendar`, `/dump`, `/ma-bra`, `/min-situation`, `/morgonstart`, `/flowstudy`, `/studier`, `/fokus` är rena redirect-shims till sin efterföljare. Behåll dem för gamla bokmärken/push-länkar.
- **Idag/Kalender/Lägg till är redan EN vy**: alla tre routes renderar `src/pages/day-hub.tsx` med olika `tab`. Grundlogiken är alltså redan gemensam.
- **Medicin är konsoliderad**: kanoniska nycklar + migrering från gamla nycklar i `src/lib/medications.ts`. Behåll som mönster för andra domäner.
- **Molnsynk + kryptering**: `cloud-storage.ts` (Supabase `user_kv`) och `secure-local.ts` (AES-GCM för energi/mående/medicin/ekonomi) är en genomtänkt grund.
- **Analytics-dedupe**: `track()` i `src/lib/analytics.ts` har inbyggd dubbelspärr för view-events.
- **Bottennav-skydd**: `pb-24 md:pb-8` + `env(safe-area-inset-bottom)` i `layout.tsx` gör att innehåll inte hamnar bakom navigeringen. Ingen bred bugg där.
- **Global textbrytningsspärr** i `styles.css` som förhindrar bokstav-för-bokstav-vertikal text.

## 2. Vad som är dubbelt / kan tas bort

- `src/components/overwhelmed-modal.tsx` – helt oanvänd (ersatt av `stop-modal.tsx`). Död kod.
- `src/components/ui/card.tsx` (shadcn Card) – ett tredje kortsystem med egen kollapslogik, används bara på `flow-settings.tsx`. Migrera den sidan och ta bort beroendet.
- Tre sidor med överlappande syfte "vad gör jag nu": `/flowplan` (planera ordning), `/flow` (en sak i taget), `/assistant` (chatt). De ligger i samma navkategori och gränsen är otydlig för användaren.
- **Två parallella energibegrepp**: `energy_logs` (nivå 1–5 check-in) och `energy_factors` (vad som ger/tar energi) plus lokal `myflove-energy-log`-cache. Tre system som lätt förväxlas.
- **Två fysiska lager för samma uppgift**: `myflove-quickflow-priority` (PriorityTask) speglas till `myflow-tasks` (Task) via CustomEvents.
- Fri-textloggning via `trackEvent()` parallellt med schemalagd `track()` (shopping, ekonomi, medicin, dump).
- Egna färgpaletter: `family.tsx` har en egen hexpalett vid sidan av `--lavender/--blush/--mint/--sky`.

## 3. Vad som har olika logik och bör förenas

- **Kortmönster**: `medication.tsx`, `routines.tsx`, `finances.tsx` och delar av `reminders.tsx`/`calendar.tsx` bygger egna `bg-card rounded-2xl border shadow-sm`-kort istället för `MyFloveBlock` (fel radie, fel skugga, fri padding).
- **Rubriker**: vissa sidor använder delad `MyFloveHeader`, andra egen `<h1 className="text-3xl font-bold">`.
- **Skuggskala**: `shadow-sm` (Tailwind default) blandat med token-skuggorna `shadow-soft`/`shadow-lifted`.
- **Grid-mönster**: de flesta sidor kör `auto-fit,minmax(min(100%,9rem),1fr)`; `finances.tsx` och `calendar.tsx` kör hårda `grid-cols-3`.
- **Modaler**: `MyFloveModal` sätter `max-h-[85dvh] overflow-y-auto`, men tre dialoger i `calendar.tsx` använder rå `DialogContent` utan höjdgräns.
- **QuickFlow ↔ Idag**: synkas via händelselyssnare i två riktningar i stället för en gemensam datakälla.

## 4. Navigations-/genvägsfel

- `quickflow-priority.tsx` "Börja med denna" → `/fokus`, som direkt redirectar till `/flow`. Onödigt hopp.
- `src/lib/flow-priorities.ts` (studier) → `/studier`, som redirectar till `/studyflow`. Onödigt hopp.
- Push-notis (`api/public/hooks/push-tick.ts`) → `/morgonstart`, som redirectar till `/daglig-rutin`. Extra sidladdning från notis.
- Kommentaren i `_app.fokus.tsx` säger "hopslaget med FlowPlan" men redirectar till `/flow` – kommentar och mål stämmer inte överens; behöver ett produktbeslut.
- `/idag`, `/kalender`, `/lagg-till` presenteras som tre fristående navmål trots att det är samma vy – ger sken av tre sidor.
- Sidor utan väg in från navigationen: `/pitch` (endast via admin, avsiktligt), `/guide/adhd-planner-for-adults` (endast SEO), `/dev-session` (devverktyg).

## 5. Visuella/layoutproblem

- `finances.tsx`: `grid-cols-3` med belopp i `text-xl` → hoptryckt vid 320–360px.
- `calendar.tsx`: flera fasta `grid-cols-3`-knapprader utan auto-fit.
- Tre dialoger i `calendar.tsx` utan `max-h`/`overflow-y-auto` → risk att "Lägg till"-knappen inte går att nå med tangentbordet uppe.
- `sheet.tsx` (bottom sheet) saknar inbyggd höjdgräns/scroll – sårbart för framtida användning.
- Hårdkodade färger: `#a06cd5`, `#8a9a5b`, `bg-white/80` m.fl. i `calendar.tsx`; `text-white` i `calendar.tsx`, `children.tsx`, `family.tsx`; `bg-black` i `pitch.tsx`.
- Padding-inkonsekvens `p-4`/`p-5`/`p-6` i samma vy (finances).

## 6. Data-/statistikproblem

- **Risk för dataförlust vid utloggning** (lokala nycklar utan molnsynk som rensas av `clearLocalUserData`):
  - `myflow-dump-ideas` (ej konverterade idéer) – allvarligast.
  - `myflove-energy-pending` (energiloggar gjorda utloggad, väntar på migrering) – förloras om migreringen inte hunnit köra.
  - `myflow-shopping`, `myflow-saved-stores/-trips`, `myflow-focus`, `myflove-flow-usage`.
- **Källa till sanning oklar för energi**: lokal cache + `energy_logs` + `energy_factors` samexisterar.
- **Dubbelskrivning vid avbockning**: en klarmarkering skriver både PriorityTask och Task (två molnupserter i samma debounce-fönster).
- **Transient dubbelvisning**: `use-flow-items.ts` filtrerar prioriteringsposter som redan har en kopplad uppgift, men speglingen sker i en `useEffect` – kort fönster vid hydrering där posten kan visas dubbelt.
- **Två spårningsvägar**: `track()` (schema + dedupe) och direkt `trackEvent()` (fri text, ingen dedupe). Ingen faktisk dubbelräkning idag, men strukturell risk.
- `myflow-analytics-session-id` rensas vid utloggning – bör bekräftas som avsiktligt.

## 7. Rekommenderad slutstruktur, sida för sida

- **Hem** – översikt och genvägar, inga planeringsfunktioner.
- **Dagen** (`/idag`, `/kalender`, `/lagg-till`) – behåll en vy med tre flikar, men presentera i navigationen som ETT mål "Min dag" med flikar.
- **QuickFlow** (`/quickflow`) – snabb infångning + prioritering utan tidskrav. Enda vägen in för nya saker; planerade poster syns i Dagen utan dubbletter.
- **Flow** – slå ihop till en ingång: `/flow` som hjälp-läge, `/flowplan` som dess planeringssteg, `/assistant` som chattflik inne i Flow.
- **Energi & mående** (`/mitt-batteri` + `/energifloede`) – batteri = loggning, energiflöde = mönster/faktorer. Tydliggör i UI att det är två olika saker.
- **Hälsa / Medicin / Rutiner** – samma blockdesign som Hälsa; Medicin och Rutiner migreras till `MyFloveBlock`.
- **Påminnelser** – konsekvent blockdesign, samma listrad som Dagen.
- **Ekonomi** – auto-fit-grid, `MyFloveBlock`, tokenfärger.
- **Inställningar / Anpassa / Profil** – behåll nuvarande uppdelning, men flytta `flow-settings` till samma kortsystem.
- **Admin / Pitch / Guide** – behåll utanför vanliga navigationen.

## 8. Prioriterad åtgärdsordning

**Kritiskt**
1. Skydda lokal data vid utloggning: `myflow-dump-ideas` och `myflove-energy-pending` (molnsynk eller migreringsgaranti innan rensning).
2. Retry/felhantering för `energy_pending → energy_logs`.
3. Rätta CTA:er som går via redirect: `/fokus`, `/studier`, `/morgonstart` (push).
4. Lägg `max-h`/scroll på de tre dialogerna i `calendar.tsx` och på `sheet.tsx`.

**Viktigt**
5. Tydliggör en ingång för Flow/FlowPlan/Assistant.
6. En källa till sanning för QuickFlow↔Idag (en post, inte spegling), alternativt synkron spegling så dubbelvisning inte kan uppstå.
7. Migrera `medication.tsx`, `routines.tsx`, `finances.tsx`, `reminders.tsx`, `flow-settings.tsx` till `MyFloveBlock`/`MyFloveHeader`.
8. Ersätt hårda `grid-cols-3` med auto-fit i finances och calendar.
9. Samla all loggning bakom `track()`.

**Polish**
10. Ta bort `overwhelmed-modal.tsx` och shadcn `Card`-beroendet.
11. Ersätt hex/`text-white`/`bg-black` med tokens; flytta `family.tsx`-paletten till tokens.
12. Enhetlig skuggskala och padding.
13. Navigationsetiketter: "Min dag" som ett mål med flikar.

## 9. Risker med en städning

- **Datamigrering**: att flytta `dump-ideas`/`shopping` till molnet kräver en engångsmigrering från lokal lagring vid första inloggning, annars ser användaren en tom lista.
- **QuickFlow-sammanslagning**: att gå från spegling till en post rör befintliga `quickflowId`-kopplingar; behöver en migrering som mappar existerande PriorityTasks till Tasks utan att tappa klarmarkeringar.
- **Redirect-borttagning**: ta INTE bort legacy-routes – gamla push-notiser och bokmärken pekar dit.
- **Blockmigrering**: `medication`/`routines`/`finances` har formulärlogik i samma komponenter; risk för regressioner om markup skrivs om brett. Bör göras sida för sida med visuell kontroll.
- **Analytics-samling**: att flytta `trackEvent`-anrop till `track()` kan bryta jämförbarhet i historisk statistik (nya eventnamn).
- **Färgtokenisering**: barn-/familjefärger är användarvalda och sparade som hex i databasen; token-bytet får inte ändra sparade värden.

Vill du att jag går vidare och börjar med det kritiska blocket (punkt 1–4)?

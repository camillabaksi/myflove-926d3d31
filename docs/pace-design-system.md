# Pace design system for Paceable

Paceable is the place, Pace the companion; Din takt is separate. Presentation only: no storage, account reads/writes, analytics or submission logic. No publication.

Reference: `/designsystem` — isolated sample data, no navigation entry, noindex. Theme/still controls never change saved preferences. Example submission validates but never persists.

## Foundation
`src/styles.css` keeps existing HSL tokens and approved warm off-white/plum accents. Explicit `data-pace-design` opt-in; no global control override.

| Role | Tokens |
| --- | --- |
| Canvas / surface / raised | `--pace-canvas`, `--pace-surface`, `--pace-surface-raised` |
| Text / metadata | `--pace-text`, `--pace-text-secondary` |
| Border / focus / selection | `--pace-border-warm`, `--pace-focus`, `--pace-selected` |
| Error wording | `--pace-danger` plus explicit invalid border, never color alone |
| Depth | `--pace-elevation-0/1/2`: flat / item-tool / dialog |
| Spacing | `--pace-space-1/2/3/4/6/8`: .25/.5/.75/1/1.5/2 rem |
| Radius | `--pace-radius-control/card`: .75/1.5 rem |
| Touch / icon | `--pace-touch`: 44px; `--pace-icon`: 1.125rem |

### Etapp 1 – gemensam referens
- Primär handling: `--pace-primary: hsl(295 38% 24%)` (**#512654**) med varm ljus text. Paletten i övrigt återanvänder befintliga HSL-variabler; inga globala färger ersätts.
- Sidmarginal: `--pace-page-gutter` = 1rem mobil, 1.5rem från 640px och 2rem från 1024px.
- Innehållsbredder: `--pace-content-reading` 42rem, `--pace-content-list` 52rem, `--pace-content-wide` 60rem.
- Avstånd: `--pace-space-1/2/3/4/5/6/8/10` = 4/8/12/16/20/24/32/40px.
- Kort: innehållsstyrd höjd, `--pace-card-padding` 1rem mobil och 1.25rem från 640px, `--pace-radius-card` 1.5rem och elevation 1.
- Informationsblock: samma padding, `--pace-radius-block` 1.25rem, tonad befintlig accent, tunn kant och ingen skugga.
- Kontroller: `--pace-control-visual` 2.5rem inom minst `--pace-touch` 44px faktisk tryckyta; naturlig radbrytning.
- Dialog: upphöjd yta/elevation 2, 1.5rem radie, 44px stängningsmål, synlig fokusmarkering och innehåll som får brytas.

### Shared app typography — 2026-10-11

The app uses Fraunces for all text roles, including body text, controls and legacy display/handwritten headings, following the user's preference for the original soft editorial font. `src/app-typography.css` loads after the legacy stylesheet and uses a separate `data-paceable-typography` scope on authenticated routes, sign-in/up and the isolated reference. The html flag also covers portalled dialogs and menus. The scope maps the legacy sans/display/editorial aliases to one Fraunces stack without changing the global marketing tokens. We load genuine weights 400, 500, 600 and 700 for regular text, controls, headings and emphasis. Public marketing retains its existing typography; approved logo pixels stay unchanged.

| Role | Size |
| --- | --- |
| Page title / greeting | 2rem (32px at default text size) |
| Section / dialog title | 1.25rem (20px) |
| Card title | 1.125rem (18px) |
| Body / controls | 1rem (16px) |
| Labels / help / navigation group labels | .875rem (14px) |
| Compact metadata / bottom navigation labels | .75rem (12px) |

Rem units preserve browser and existing NPF larger-text settings. Headings use weight 600, normal letter spacing and consistent line heights. Small legacy 9–11px labels join the metadata role. Large timers, decorative emoji and special numeric/chart geometry remain separate. Typography changes never own field behavior, storage, permissions or submission. Existing editorial component props/classes remain compatible but use the shared Fraunces typography in the app scope.

## Patterns
Import from `@/components/paceable/design-system`:
- PacePage: scope only, no navigation or main landmark.
- PaceContent: `reading`, `list` eller `wide`; sätter bara responsiv maxbredd.
- PaceHeading: level 1/2/3, explicit optional editorial role.
- PacePageTitle: standalone explicit editorial h1; no page-wide scope or sibling-form restyling. First adopters: Settings, Anpassa, Notes and Relations. More remains unchanged.
- PaceSection: unframed accessible section. PaceCard: framed tool/repeated item, no decorative nesting.
- PaceInfoBlock: lugnt informationsunderlag utan upphöjning; inte ett kort i ett kort.
- PaceBlock: original MyFloveBlock; retain collapseId and existing persistence behavior.
- PaceButton/Input/Textarea: existing APIs/refs, scoped presentation.
- PaceField: one actual control child; connects label/help/error and preserves descriptions/handlers. Select belongs outside, PaceSelectTrigger inside.
- PaceSelectTrigger/Content: existing Select API, separate portal scope. Local themes require a dark class on portalled content; production html.dark continues working.
- PaceChoiceGroup/Choice: fieldset/legend, controlled selected state, aria-pressed; not tabs or calendar geometry.
- PaceSwitch: original boolean control and accessible label/help/hit area; state stays caller-controlled.
- PaceActions/Help: wrapping actions, 44px inline help button.
- PaceDialogContent: original Dialog API; use existing Trigger/Title/Description for accessible focus behavior. Portal opts in separately.
- PaceStatus: empty/loading/saving/saved/error announcements, no save effects/timeouts.
- paceFormSurface: shared existing pilot classes, deliberately identical rendering.

Controls need PacePage or pace-ds scope; portals supply their own. Reduced motion/still mode disables animation. Existing UI primitives remain unchanged.

## Conversion inventory
| Surface | Status |
| --- | --- |
| Idag, Kalender, Fånga/Tankar, Min plats, Mer | Approved/protected; no automatic conversion |
| Logga just nu | Existing pace-form; caller/draft behavior retained |
| Anpassa, PersonalizationSettings, aviseringskort, Ny rutin/Snabbstart | Pilot shares paceFormSurface with unchanged rendering |
| Uppgifter | Approved local presentation |
| Settings/profile, other reminders/medicine dialogs | Candidates; inspect actual open form before Field/Actions/Dialog conversion |
| Daily-flow, energy-flow, home, flowscore, history, mood, dump | Candidate forms, not proved visually inconsistent |
| Family/visual-child-schedule | Authorized visual review before field-only conversion; privacy/semantic colors protected |
| Calendar/capture/display-name dialogs | Explicitly protected, no conversion here |

## Prioriterade kontrollpunkter för senare etapper – inte ändrade i etapp 1
| Observerat problem | Orsakande presentation | Separat avgränsad framtida kontroll |
| --- | --- | --- |
| Dialogen **Logga just nu** blir för hög | `flow-checkin-popup.tsx` ger dialogen 85vh och scroll; `simple-checkin.tsx` lägger ett fullhöjdsblock, tre orkval, fem måendeval, anteckning och fördjupning i samma flöde. | Mät öppnad dialog på 320/360/390px och stora systemtexter. Justera endast mobilens höjdfördelning/sticky handling/kompakt valpresentation; bevara utkast, sparning och fältordning. |
| **MyFlove Insight** har gammalt namn och fel mobilkomposition | Synlig titel finns i `pages/insight.tsx` och sidmetadata i `_app.insight.tsx`. Sidhuvudet har tillbakaikon, illustrationssymbol, titeltext och Hem-länk i en enda flexrad. | Egen copy-/headeretapp med godkänt synligt namn och två-radig mobilgrid. Ändra inte Insight-beräkningar, data eller destinationslänkar. |
| **Energi & mående över tid** bryts över flera rader | `energy-mood-trend.tsx` använder sex kolumner på liten skärm för upp till åtta veckoperioder; resten hamnar på en ny rad. | Välj i separat diagrametapp mellan läsbar färre-periodsvy och horisontell periodrad. Behåll värden, perioder, kvalitativ text och tillgänglighetsbeskrivningar. |
| **Batteri & faktisk tid** blir långt och svårt att tolka | `battery-load-trend.tsx` visar 28 dagar i fyra kolumner, 12 veckor/månader i samma karta, text inne i staplar samt två efterföljande sammanfattningsrutor. | Testa en kompakt, progressivt utfälld mobilpresentation. Behåll alla beräkningar, periodval och full information för tangentbord/skärmläsare. |

Dessa fyra punkter är dokumentation, inte genomförande. Berörda vyer och komponenter är oförändrade i etapp 1.

## Checklist
Screenshot actual form first; class names alone do not establish defects. Keep handlers/refs/IDs/collapse keys/options/tab order/permissions/submission unchanged. No autosave or draft resets. Check light/dark, 360–1440px, 200% text, long names/errors, keyboard/dialog restoration, AA contrast and 44×44 actions. No ellipsis/font reduction; retain calendar geometry. Run save/draft/full regressions; report screenshots and physical-device/assistive-tech limitations.

This delivery is the system/reference/pilot, not full app conversion.

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

Inter for function; Fraunces only via explicit editorial PaceHeading. No global heading conversion. Keep approved logos/stones and semantic calendar/destructive colors.

## Patterns
Import from `@/components/paceable/design-system`:
- PacePage: scope only, no navigation or main landmark.
- PaceHeading: level 1/2/3, explicit optional editorial role.
- PaceSection: unframed accessible section. PaceCard: framed tool/repeated item, no decorative nesting.
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

## Checklist
Screenshot actual form first; class names alone do not establish defects. Keep handlers/refs/IDs/collapse keys/options/tab order/permissions/submission unchanged. No autosave or draft resets. Check light/dark, 360–1440px, 200% text, long names/errors, keyboard/dialog restoration, AA contrast and 44×44 actions. No ellipsis/font reduction; retain calendar geometry. Run save/draft/full regressions; report screenshots and physical-device/assistive-tech limitations.

This delivery is the system/reference/pilot, not full app conversion.
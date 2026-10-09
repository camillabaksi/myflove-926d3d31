# Pace – settings form stage, 2026-10-09

## Converted after actual rendered inspection
- `/installningar`: existing language, customization and app settings blocks use `PaceBlock` and `PaceButton` inside local design-system scope. Language pressed state exposed; labels, links and handlers unchanged.
- `/flow-installningar`: existing three blocks, level buttons and time inputs reuse Pace patterns. Standalone editorial title replaces framed orientation; existing FlowCharacter retained. Switch and slider targets enlarged without changing values, bounds or handlers.
- No new controls, save system, storage or dependencies. Existing settings still save immediately through their original handlers; no new autosave introduced.

## Verified
- 56 checks: two pages × seven widths (360/390/430/768/1024/1280/1440) × light/dark × normal/doubled text on all descendants of the local form scope. Open blocks inspected. No document overflow; no visible buttons below 44px height (measurement tolerance 1px).
- Before/after screenshots reviewed at 390px; dark screenshots taken after color transitions settle. At 200%, the long title can break within its final word rather than truncate. No smaller text or ellipsis introduced.
- Two new regression tests preserve level/time updates, time field IDs, switch update, reset, slider bounds and specific `/flow` link. All 540 tests across 86 files passed.
- Browser page errors: none. Time field keyboard focus verified. All switch IDs retained. No real settings toggled, reset, or saved during browser review.
- More screenshot pixel-identical against prior baseline. Layout and More source untouched. Primary pages, profile/barn handlers, calendar/Core, auth, data and permissions untouched.
- Automatic build log reports build OK. Inspected content-route metadata, including index: existing title/description/social fields present; no metadata edits.

## Remaining staged work
NPF and personalization pilots already use Pace form surfaces; not reconverted unnecessarily. Profile, life profile and home customization still need detailed open-form review; profile name autosave and child actions are explicitly preserved. Recovery, everyday planning, support and family groups remain subsequent small stages, not claimed complete. Physical devices, assistive technologies, real cross-device sync and complete AA auditing were not performed here. Nothing published.

Evidence: `/tmp/browser/pace-forms/` (scripts, screenshots and logs).
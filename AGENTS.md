<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

Min Flow appearance/memories use existing account-scoped cloud storage and one customization sheet for home/legacy; no parallel preference/chat system. Room animation stays scene-specific; shared FlowMascot elsewhere is unchanged. Render seated Flow as the approved whole-scene image with pose-fitted variants only; preserve but hide incompatible saved options to protect identity/perspective.

Paceable editorial/capture/help remain opt-in for legacy isolation. BrandLogo uses approved originals and .dark; illustrative stones/Flow stay unchanged to prevent identity drift.
Desktop Träning uses document navigation to prevent stalled transitions.
Public landing demos never use account data/sync, protecting saved plans. Local data has one account owner; sync only while that owner is signed in to prevent shared-device leaks.
Sync user_kv by read → three-way merge (sync-merge) → conditional write on updated_at, so concurrent devices never overwrite each other silently.
Never fall back to plaintext for sensitive local keys; keep them in memory and surface a status instead, because encryption at rest must not depend on startup timing.
A child profile's linked account (children.account_user_id) never gets row access to the owner's children/child_items; it reads only safe fields via get_my_child_profiles/get_my_child_schedule/get_my_shared_child_items (explicit item shares, deduped against the schedule), and the link never gates the account's own features in the UI, so parent-only data is enforced by the database while the person stays a full MyFlove user.
Family sharing audience is NULL = whole household (including future members) or an explicit user list (family_share_areas.viewers, child_items.share_family + child_item_shares); an empty list means nobody, so deselecting can never widen access.
The visual calendar uses a read-only period projection over existing account stores and authorized family queries; mutations target their original source, while linked parent-managed schedules remain separate and read-only, to preserve ownership and privacy.
Calendar keeps one tool/form, dialogs/stores and desktop/mobile order. Mobile ImpactCheckin opts in; drafts stay in page state across view remounts, never storage/autosave. Today widths stay page-scoped.
Calendar planning capacity comes only from useCapacityMode/FlowPlan, self-reported energy is shown separately from existing energy logs, and load indicators use explicitly supplied energy impact without invented percentages; unknown durations never produce asserted free-time gaps.
HomePriorityActions reuses useDayCapacity and CapacityBattery for the same daily capacity as the calendar, and opens the existing SimpleCheckin form for logging; this avoids competing energy estimates or parallel storage on Home.
Calendar area presentation uses calendarArea to resolve explicit life areas and known source defaults, with semantic calendar-area CSS tokens matching AREA_META hues; energy impact stays separate so colors consistently identify an area without changing stored records or permissions.
Family calendar layers project calendar-only fields from existing authorized child rows and owner-scoped school schedules; context never consumes parental time/load, and explicit presence is required, so profile/account identities and privacy remain separate.
Child schedule focus follows times independently of completion, with untimed items separate and no completion controls in any schedule rendering, so only owned parent tasks participate in task achievements.
Month cells summarize unique existing areas (family context collapses to the existing family area), with capacity only for today or recorded history; this prevents activity volume and unknown future energy from becoming visual noise.
Today uses the shared day-capacity source and authorized calendar projection for one contextual Flow observation, with the existing mascot; never infer new capacity, recovery benefits or free time from unknown durations.
Pace v1 is a transient deterministic interpretation of registered Capacity, qualitative calendar Load, and verified time spacing; it never persists, estimates future Capacity, or writes to the legacy Capacity Mode, because Pace is guidance rather than a score or planning engine.
Secondary pages share Paceable scope; primary pages stay locked. Tasks uses local tokens; IDs/routes stay. DailyFlowList is Today-only; Swedish dates capitalize only the first character.
Legacy forms opt in with pace-form tokens; approved calendar/capture/name forms and UI primitives stay untouched to prevent regressions.

More reuses filtered navItems/groups and scoped styles. Compact expansions use full-width sibling lists to avoid stretching adjacent controls. Dismissal restores focus; navigation focuses content. Groups use essential filtering; search stays unfiltered.
Narrow greetings balance name breaks; full names, profile data and approved stones stay intact.

Today/Calendar use local rem/container rules for enlarged text; normal layout and timeline geometry stay locked.
3D companion prototypes use standalone temporary projects and dependencies, never app routes/data, to isolate unapproved models.

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

Paceable uses scoped editorial roles and opt-in capture/help appearances; defaults stay unchanged to isolate legacy. Existing stone placements reuse the approved image; preserve legacy SVG and Today rendering to prevent identity drift.
Desktop Träning uses direct document navigation so existing tabs cannot stall on an in-app transition.
Keep the public landing preview isolated from account data and sync; its interactive examples are local-only so visitors cannot affect saved plans.Scope all local user data to one owning account (account-scope) and only sync when that owner is signed in, so data can never cross accounts on a shared device.
Sync user_kv by read → three-way merge (sync-merge) → conditional write on updated_at, so concurrent devices never overwrite each other silently.
Never fall back to plaintext for sensitive local keys; keep them in memory and surface a status instead, because encryption at rest must not depend on startup timing.
A child profile's linked account (children.account_user_id) never gets row access to the owner's children/child_items; it reads only safe fields via get_my_child_profiles/get_my_child_schedule/get_my_shared_child_items (explicit item shares, deduped against the schedule), and the link never gates the account's own features in the UI, so parent-only data is enforced by the database while the person stays a full MyFlove user.
Family sharing audience is NULL = whole household (including future members) or an explicit user list (family_share_areas.viewers, child_items.share_family + child_item_shares); an empty list means nobody, so deselecting can never widen access.
The visual calendar uses a read-only period projection over existing account stores and authorized family queries; mutations target their original source, while linked parent-managed schedules remain separate and read-only, to preserve ownership and privacy.
CalendarPlanner keeps one instance per tool/form and existing dialogs/stores; desktop check-in follows the calendar, mobile order stays intact. Today widths stay page-scoped to avoid shared/mobile changes.
Calendar planning capacity comes only from useCapacityMode/FlowPlan, self-reported energy is shown separately from existing energy logs, and load indicators use explicitly supplied energy impact without invented percentages; unknown durations never produce asserted free-time gaps.
HomePriorityActions reuses useDayCapacity and CapacityBattery for the same daily capacity as the calendar, and opens the existing SimpleCheckin form for logging; this avoids competing energy estimates or parallel storage on Home.
Calendar area presentation uses calendarArea to resolve explicit life areas and known source defaults, with semantic calendar-area CSS tokens matching AREA_META hues; energy impact stays separate so colors consistently identify an area without changing stored records or permissions.
Family calendar layers project calendar-only fields from existing authorized child rows and owner-scoped school schedules; context never consumes parental time/load, and explicit presence is required, so profile/account identities and privacy remain separate.
Child schedule focus follows times independently of completion, with untimed items separate and no completion controls in any schedule rendering, so only owned parent tasks participate in task achievements.
Month cells summarize unique existing areas (family context collapses to the existing family area), with capacity only for today or recorded history; this prevents activity volume and unknown future energy from becoming visual noise.
Today uses the shared day-capacity source and authorized calendar projection for one contextual Flow observation, with the existing mascot; never infer new capacity, recovery benefits or free time from unknown durations.
Pace v1 is a transient deterministic interpretation of registered Capacity, qualitative calendar Load, and verified time spacing; it never persists, estimates future Capacity, or writes to the legacy Capacity Mode, because Pace is guidance rather than a score or planning engine.
Paceable isolates legacy themes; keep IDs/routes to avoid migration. Integrated DailyFlowList is Today-only, reusing actions/data. Swedish date headings capitalize only the first character; other locales stay intact.

Desktop More dismissal restores trigger focus; its link navigation focuses new page content, preserving unrelated focus. Groups reuse mobile essential filtering; search remains unfiltered.
Narrow greetings use balanced optional name breaks, preserving complete names, profile data and approved stones.

Today/Calendar use local rem probes and container rules for enlarged text; preserve normal layout and fixed timelines to keep scheduling geometry unchanged.

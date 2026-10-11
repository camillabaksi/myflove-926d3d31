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

Flow appearance, room scenes and memories: see src/components/flow/AGENTS.md.

Paceable editorial/capture/help opt in to isolate legacy. BrandLogo uses approved originals and .dark; brand stones stay unchanged to prevent identity drift.
Desktop Träning uses document navigation to avoid stalls.
Training programs keep complete optional Workout payloads in the existing account-owned training store, retaining images, doses and runners across reloads; legacy text sessions stay valid. Pace's weekly generator selects only illustrated catalog IDs compatible with declared equipment/limitations, without forecasting energy. Manual creation uses the same store and never calls AI; edits preserve chosen visual blocks.
Public landing demos never use account data/sync, protecting saved plans. Local data has one account owner; sync only while that owner is signed in to prevent shared-device leaks.
Sync user_kv by read → three-way merge (sync-merge) → conditional write on updated_at, so concurrent devices never overwrite each other silently.
Sensitive local keys never fall back to plaintext: keep them in memory and show status; encryption at rest must not depend on startup timing.
A child profile's linked account (children.account_user_id) never gets row access to the owner's children/child_items; it reads only safe fields via get_my_child_profiles/get_my_child_schedule/get_my_shared_child_items (explicit item shares, deduped against the schedule), and the link never gates the account's own features in the UI, so parent-only data is enforced by the database while the person stays a full MyFlove user.
Family sharing audience is NULL = whole household (including future members) or an explicit user list (family_share_areas.viewers, child_items.share_family + child_item_shares); an empty list means nobody, so deselecting can never widen access.
The visual calendar uses a read-only period projection over existing account stores and authorized family queries; mutations target their original source, while linked parent-managed schedules remain separate and read-only, to preserve ownership and privacy.
Calendar keeps one tool/form, dialogs/stores and desktop/mobile order. Mobile ImpactCheckin opts in; drafts stay in page state across view remounts, never storage/autosave. Today widths stay page-scoped.
Calendar planning capacity comes only from useCapacityMode/FlowPlan, self-reported energy is shown separately from existing energy logs, and load indicators use explicitly supplied energy impact without invented percentages; unknown durations never produce asserted free-time gaps.
HomePriorityActions reuses useDayCapacity and CapacityBattery for the same daily capacity as the calendar, and opens the existing SimpleCheckin form for logging; this avoids competing energy estimates or parallel storage on Home.
Idag, Kalender, Mitt batteri and Dagens balans share the registered day-capacity value. The latest timestamped energy log or morning entry wins; legacy morning entries without a timestamp are fallback only. Keep the separate calculated energy curve explicitly labelled and secondary, and never present energy-factor sums or legacy planning scores as measured capacity. Dagens balans reuses the same qualitative Pace interpretation and authorized family projection as Idag.
Reminder sync mounts once in the authenticated route and checks the active data owner before writes. Quiet mode reuses the account-owned user_kv value, including its IANA time zone, so foreground and background pauses agree. Queued pushes use expiring conditional leases and per-endpoint receipts: unchanged sync never resets delivery, failed/no-device sends remain pending, and edits/cancellations invalidate old workers. Keep private cron authentication and user-selected notification opt-ins intact.
Native reminders reuse the shared explicit reminder projection and use the OS queue only after per-account, per-device opt-in. Serialize all bridge writes and logout, invalidate stale account/edit workers, preserve unreadable encrypted sources, and never request OS permissions from automatic sync. Bound pending occurrences to 60, honor quiet mode and selected sound, and keep existing signed app identities. New native plugins require signed Android/iOS builds and physical locked-screen verification; publishing the website alone does not install them.
Quick check-in and energy history display the shared account-owned energy cache, refreshed from energy_logs, including pending observations. Keep stable UUIDs through retries, preserve new entries during reads/migration, and await saving before closing a check-in; cloud updates must never replace a started form draft.
Activity energy answers use the original source id and occurrence date, link the confirmed energy factor to that occurrence, and reuse its UUID for retries/changes. Keep the prompt open on failed saves and preserve queued activities; completion itself remains in the original store.
Calendar area presentation uses calendarArea to resolve explicit life areas and known source defaults, with semantic calendar-area CSS tokens matching AREA_META hues; energy impact stays separate so colors consistently identify an area without changing stored records or permissions.
Family calendar layers project calendar-only fields from existing authorized child rows and owner-scoped school schedules; context never consumes parental time/load, and explicit presence is required, so profile/account identities and privacy remain separate.
Child schedule focus follows times independently of completion, with untimed items separate and no completion controls in any schedule rendering, so only owned parent tasks participate in task achievements.
Month cells summarize unique existing areas (family context collapses to the existing family area), with capacity only for today or recorded history; this prevents activity volume and unknown future energy from becoming visual noise.
Today uses the shared day-capacity source and authorized calendar projection for one contextual Flow observation, without requiring a decorative mascot; never infer new capacity, recovery benefits or free time from unknown durations.
Pace v1 is a transient deterministic interpretation of registered Capacity, qualitative calendar Load, and verified time spacing; it never persists, estimates future Capacity, or writes to the legacy Capacity Mode, because Pace is guidance rather than a score or planning engine.
Secondary pages share Paceable scope; Tasks uses local tokens. DailyFlowList's integrated rows are used on Today and in calendar day tools; other callers keep the card default. DailyActivityRow owns presentation only, preserving completion/menu ownership in callers. Swedish dates capitalize only the first character.
Forms opt in; preserve protected forms. Pace tokens stay under `.pace-ds`. See src/components/paceable/AGENTS.md.

App typography uses Fraunces for headings/greetings/clock numerals and Lora for activities, reading text and controls, with shared rem roles in `src/app-typography.css` loaded after legacy styles. Load genuine weights 400/500/600/700 for both families. Explicit `pace-type-activity` overrides legacy heading/display markup without resizing calendar blocks; `pace-type-time` preserves the soft Fraunces numerals, and `pace-type-category` keeps the approved 14px category role. Override compiled font utilities explicitly: Tailwind inline themes embed the original family instead of reading the scoped token. The root opts authenticated routes, sign-in/up and the isolated reference into `data-paceable-typography`; the same html flag covers portalled dialogs/menus. Keep this independent of page palette opt-ins, public marketing and approved logo assets. Preserve enlarged-text preferences, calendar positioning and special numeric readout sizes.

More reuses filtered navItems/groups and scoped styles. Compact expansions use full-width sibling lists to avoid stretching adjacent controls. Dismissal restores focus; navigation focuses content. Groups use essential filtering; search stays unfiltered.
Today reuses one shell BrandLogo (mobile header/desktop sidebar) and the shared greeting to avoid duplicate branding; preserve full names, profile data and approved assets.
AppBrandHeader and DayGreeting are presentation-only: keep navigation, collapse, names and date ownership in callers. App brand width and welcome/page/greeting/section/card/body/help/meta sizes come from app-typography.css; the mobile action row leaves room for the approved logo instead of shrinking it differently per route.

Today/Calendar use local rem/container text rules; preserve timeline geometry. Next-page compact controls opt in with 44px boxes around smaller surfaces, avoiding overlapping targets and global recoloring.
3D companion prototypes isolate unapproved models in temporary standalone projects/dependencies, never app routes/data.

Shared FlowMascot renders no image or layout box; preserve props/source and wrapper content/actions. FlowCharacter and room-image safeguards: see src/components/flow/AGENTS.md.

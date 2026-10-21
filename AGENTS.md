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

Read docs/architecture-rules.md before any changes; it preserves the project’s full architecture and privacy rules.
Read src/components/flow/AGENTS.md and src/components/paceable/AGENTS.md before changes in those directories.
Decision presentation stays scoped to `.book-decision` and its notebook workspace; point actions reuse the shared accessible dropdown without changing draft or persistence ownership, so other notebook editors and account data remain unaffected.

Standalone film refinements use versioned copies of the saved renderer and its source assets outside app routes; preserve deterministic motion/text timing and never replace the published intro, so media review cannot alter account data or the live product.

Native release preparation changes Android Gradle and both iOS target version settings together, while retaining each platform's existing store identity, host and signing; use existing Codemagic workflows and report signed artifacts separately from source preparation because web validation cannot prove a native release.
Secondary page headers opt in to PacePageHeader with existing title, description and action slots; the component owns presentation only, so approved Pace/More views and caller-owned drafts, navigation and persistence remain unchanged.
Compact secondary-page layouts opt in through `.pace-ds.pace-compact-page`; shared segmented styling wraps existing Radix tabs, route links or pressed buttons without changing their semantics or state ownership, preserving drafts and protected pages.
Enlarged-text tablet navigation reuses the mobile shell controls and bounds desktop brand/sidebar width independently of text size, preserving readable content without shrinking user text.
Mobile calendar geometry comes from calendar-geometry for every forward/reverse coordinate and visual collision floor; compact controls opt in without shrinking their hit areas, preserving event times, desktop geometry and caller-owned drafts.
App-wide text sizes use shared rem roles in app-typography.css under the existing app flag, including portals; shared Button marks command surfaces separately from timeline targets to preserve text enlargement, brand assets and time geometry.
Notebook workspaces reuse the shared page geometry and full-width mobile navigation; paper styling stays inside editors so private draft and revision ownership is unchanged.
Battery groups existing read-only check-in history separately from the embedded EnergyFlowContent tools; source hooks, forms and legacy destinations retain ownership to avoid parallel health storage.
Push renewal uses the existing authenticated registration flow; endpoint possession never authorizes a public account write, so workers keep no session credentials.
Structural CSP is enforced independently of report-only integration diagnostics; allowlisted content-free error categories preserve debugging without exporting private messages, URLs or stacks.
Account-owned Paceable preferences participate in the same owner/stash and cloud manifest rules as legacy keys, preventing cross-account inheritance without renaming saved values.
Secure-local asynchronous reads and writes carry a lock generation, and initial auth reads cannot overwrite later auth events; stale work must never refill another session's cache or storage.
Daily space notes use a separate encrypted account-owned append-only revision list keyed by local date; shared editors preserve conflict heads and never feed calendar, family, energy or chat history. Unsaved drafts stay in owner/date-scoped session memory across remounts and are purged on auth identity changes, preventing accidental navigation loss without plaintext persistence. AI transfer remains disabled until content-free gateway logging is verified, so consent alone cannot weaken the privacy boundary.

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

Min Flow uses existing account-scoped cloud storage for appearance and explicit memories; this avoids a parallel preference or chat system.
Flow's room uses the uploaded animation only as a scene-specific visual; the shared FlowMascot remains unchanged elsewhere so existing screens keep their established identity.

Use the existing Inter and Plus Jakarta Sans typography for functional UI; reserve normal-style Caveat for selected personal greetings so readability stays consistent.
Use a direct document navigation for the desktop sidebar's Träning link so an already-open tab cannot leave that destination waiting on an in-app transition.
Keep the public landing preview isolated from account data and sync; its interactive examples are local-only so visitors cannot affect saved plans.Scope all local user data to one owning account (account-scope) and only sync when that owner is signed in, so data can never cross accounts on a shared device.
Sync user_kv by read → three-way merge (sync-merge) → conditional write on updated_at, so concurrent devices never overwrite each other silently.
Never fall back to plaintext for sensitive local keys; keep them in memory and surface a status instead, because encryption at rest must not depend on startup timing.

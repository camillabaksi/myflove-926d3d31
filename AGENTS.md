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

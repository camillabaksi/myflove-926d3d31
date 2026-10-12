# Personal energy, with fewer steps

Completed own activities show a compact, voluntary nonmodal question. A single
answer saves gained, lost, mixed or unchanged energy. Unknown/skip saves no
energy factor and completion remains intact. Existing occurrence ids and stable
factor UUIDs are retained through retries. Parent-managed child schedules remain
read-only and never ask about parental energy.

Quick-add takes two taps: select an activity, then answer how it felt. Built-in
suggestions and personal presets never decide the actual impact. Custom text and
other dates remain available; a failed save keeps the choice and stable UUID.
Start friction is not inferred from the energy answer.

After confirmed current-day gained/lost energy, the existing authenticated
feedback host offers a small, clearly labelled +/-5 percentage-point suggestion
from the latest registered capacity. This is a UI suggestion, not a learned
physiological conversion or measurement. A second, optional tap explicitly saves
it. Adjust opens a 0–100 slider in the same feedback surface. Mixed, neutral and
historical observations do not offer automatic deductions. No known capacity
means the existing check-in opens instead. No mood or duplicate factor is created
by approving an adjustment. A newer capacity registration invalidates an edited
proposal; failures retain the draft, double taps are locked, and account changes
clear transient feedback. Recovery never creates additional tasks.

Exact percentage observations reuse energy_logs and its account-owned encrypted
cache/pending UUID queue. The existing SMALLINT level stays on 1–5 for backwards
compatibility. Exact 0–100 self-report is carried in a validated human-readable
first line of the existing note: `Självskattad energi: 57 %.`. Optional free text
follows on the next line. energyPercent reads this representation, with the old
1–5 conversion for legacy/malformed notes. No schema migration or new capacity
store is introduced. Shared day capacity, observation history and battery/load
trends use the same decoder, so finer values survive cloud/offline round trips
and new devices. Legacy consumers continue to read the compatible integer level.

Mixed energy is stored explicitly as `both` in the existing text direction and
activity occurrence journal; existing historical records are untouched. It is
not described as a drain or counted as a negative net. The secondary estimated
curve no longer uses start friction as energy cost and never treats unknown
impact as a loss. Positive recurring observations describe the recorded count,
not a universal activity classification. Percentage suggestions do not yet
learn individual change sizes from history.

Release through review of the pull request; this work does not merge main,
publish Lovable or submit native builds. The separate Work chat's unpublished
workspace changes cannot be recovered from this repository.

# Fix: family sharing for shopping list and calendar

## Confirmed problem

Creating or joining a family works — it writes real rows to the database. But every
part of the app that _reads_ the family goes through a placeholder module
(`src/compat/api-client.ts`) that returns empty data and fake "success" for every
action. So:

- The shopping list always falls back to the device-only list; the "Delad med din familj"
  badge never shows and items never reach other family members.
- Calendar events look like they were added (the dialog closes, success is shown), but
  nothing is saved and nothing shows up later.

There is also no storage in the database for shared shopping items or family events yet.

## What to build

1. **Database (needs the paused cloud database to be resumed first)**
   - `household_shopping_items`: title, completed flag, which family it belongs to, who added it.
   - `household_events`: title, date, optional time, which family member it belongs to.
   - Access rules: only members of the same family can view, add, edit and delete that
     family's items and events.

2. **Replace the placeholder hooks with real ones** in `src/compat/api-client.ts`
   (keeping the exact same function names and call shapes so no page has to change):
   - `useGetMyHousehold` — reads the user's family plus its members.
   - `useListShoppingItems`, `useAddShoppingItem`, `useToggleShoppingItem`,
     `useDeleteShoppingItem` — read/write the shared shopping table.
   - `useListFamilyEvents`, `useCreateFamilyEvent`, `useDeleteFamilyEvent` — read/write
     the family events table.
   - Errors surface properly instead of a fake success callback.

3. **Verify** that `src/hooks/use-shared-shopping-list.ts`, `src/pages/shopping.tsx` and
   `src/pages/calendar.tsx` work unchanged: shared badge appears with a family, items and
   events persist and are visible to both members.

## Technical notes

- Data access uses the browser Supabase client with row-level security scoped through the
  existing `is_household_member` function; no new server functions needed.
- Shopping item ids stay numeric because `use-shared-shopping-list.ts` calls `Number(id)`.
- Calendar matches events to members by user id, so `member_id` stores the member's user id.
- The migration cannot run until the hosted database is resumed from Cloud.

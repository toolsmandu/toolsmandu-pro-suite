## Goal
On the customer dashboard inbox (`/dashboard/inbox`), stop persisting inbox addresses to the database and hide the "My inboxes" card entirely. Admin behavior stays unchanged.

## Changes

**1. `src/components/disposable-inbox/DisposableInboxView.tsx`**
- Add a new prop `persist?: boolean` (default `true`) OR branch on `mode === "user"` to skip persistence. Cleanest approach: introduce a `persist` prop so admin keeps current behavior.
- When `persist === false`:
  - Skip the initial `supabase.from("inbox_addresses").select(...)` load.
  - In `createInbox`, skip the insert into `inbox_addresses` for `mode === "user"` — just set `currentEmail` locally and call `fetchMail`.
  - Do not refresh `myAddresses` after creation.
  - Hide the entire "My inboxes" card (don't render the block).
- Keep `localStorage` for `current_email` so the inbox persists across page reloads on the same device.

**2. `src/pages/dashboard/InboxPage.tsx`**
- Pass `persist={false}` to `<DisposableInboxView mode="user" />`.

**3. Admin usage (`AdminDisposableInbox.tsx`) and Account OTP usage in OrdersPage**
- Leave as-is (default `persist=true`) so admin still sees and manages saved inboxes.
- Verify Account OTP / OTP redirect flow (which opens the inbox view) — if it's the customer dashboard inbox page, it will inherit `persist={false}` automatically. No change needed unless we want admin-side OTP redirects to also persist (they already use admin route).

## Notes
- No DB schema changes required. Existing rows remain untouched.
- `inbox-fetch` edge function works purely from the email string, so no backend impact.
- Public mode (anonymous visitors) is unaffected — still uses the edge function path.
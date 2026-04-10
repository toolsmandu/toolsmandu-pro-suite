
Problem found:
- The current code is still mixing UTC/browser-local time with Nepal time.
- `getNepalNow()` uses `toISOString()`, which returns UTC text. That makes the `datetime-local` input show the wrong wall-clock time.
- The save logic converts with `new Date(...)`, which can still be confusing depending on how the input string is formed.
- Order display functions (`formatDateTime`, `formatRelativeDate`) also use the viewer’s local timezone, so even if the saved value is correct, the admin panel can still look wrong.

What I will change:
1. Fix the Add Order default timestamp
- Replace the current Nepal helper with one that formats the current time directly in `Asia/Kathmandu` as `YYYY-MM-DDTHH:mm` for the `datetime-local` input.
- This avoids `toISOString()` entirely for the input value.

2. Fix how the manual order date is saved
- Parse the `datetime-local` value as Kathmandu wall-clock time and convert it explicitly to a UTC ISO timestamp before insert.
- Keep manual orders created as `completed` and `paid`, but ensure `created_at` is stored from the correct Nepal-selected time.

3. Make admin order dates display in Kathmandu time
- Update the shared date formatting helpers so admin-visible timestamps render in `Asia/Kathmandu`, not the browser/device timezone.
- This will make the list view, detail panel, and note timestamps consistent with Nepal time.

4. Verify all affected places in `/admin/orders`
- Add Order panel default value
- Created order timestamp in DB insert logic
- Order list “Date”
- Right panel “Date”
- Sent notes timestamps if they use the same formatter

Technical details:
- File to update: `src/pages/admin/AdminOrders.tsx`
  - remove `toISOString().slice(0, 16)`-based Nepal helper
  - add a Kathmandu formatter for `datetime-local`
  - add a safe converter from Kathmandu local string -> UTC ISO
- File to update: `src/lib/formatDate.ts`
  - use `Intl.DateTimeFormat` with `timeZone: 'Asia/Kathmandu'` for display helpers
  - likely replace browser-local `getHours/getDate/...` usage
- No database schema changes are needed.
- No auth/RLS changes are needed.

Why this should fix your issue:
- Right now the input is being filled with a UTC-derived string, which is why the visible time is off.
- After this change, both the displayed default time and the stored order time will be based on Kathmandu time consistently.

Checks after implementation:
- Open `/admin/orders`
- Click “Add Order”
- Confirm the Order Date shows current Nepal time
- Create a manual order
- Confirm the saved order shows the same Nepal time in the table and right panel
- Confirm old and new order timestamps render consistently in Nepal time

If you approve, I’ll implement this directly.

## Changes

### 1. Only show emails from the last 2 days
**File:** `supabase/functions/inbox-fetch/index.ts`

Add a `since` filter to the IMAP search (server-side, so it's also faster):

```ts
const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
const search = await client.search({ to: email, since });
```

This replaces the current unfiltered `client.search({ to: email })` on line 61. ImapFlow translates `since` to the IMAP `SINCE` criterion, so the mail server itself drops anything older than 2 days — no extra round-trips, no client-side filtering.

### 2. Rename "Refresh" → "Refresh Inbox" and make the button green
**File:** `src/components/disposable-inbox/DisposableInboxView.tsx` (around lines 218–221)

Change the Refresh button to:
- Label: `Refresh Inbox`
- Style: solid green using Tailwind classes that match the existing design tokens (`bg-green-600 hover:bg-green-700 text-white border-green-600`), keeping the same icon + loading spinner behavior.

```tsx
<Button
  onClick={() => fetchMail(currentEmail)}
  disabled={loading}
  className="bg-green-600 hover:bg-green-700 text-white"
>
  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
  Refresh Inbox
</Button>
```

(Drop `variant="outline"` so the green fill shows.)

### Notes
- No DB or schema changes.
- `inbox-fetch` will be redeployed automatically after the edit.
- The 2-day window applies to **all** views (admin inbox viewer, customer dashboard inbox, and public `/inbox`) since they all go through the same edge function.

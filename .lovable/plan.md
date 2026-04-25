
# Cross-Project Expired Orders

## Goal

- **Project B** is the source of truth for orders (creation, status, completion).
- **Project A** (this one) shows those orders' expiry status on its **Expired Orders** page.
- A never writes to B. No local mirror. No duplication.

## Architecture

```text
[Project A - Admin UI]                         [Project B - Supabase]
  Expired Orders page                            orders, order_items,
        │                                        product_variations
        │  invoke('fetch-expired-orders')              ▲
        ▼                                              │
[Project A edge function] ──HTTPS + shared API key──► [Project B edge function]
  fetch-expired-orders-proxy                          expired-orders-feed
  (forwards request, hides B's URL/key)               (service-role read,
                                                       returns flattened rows)
```

Why this shape:
- B holds a single edge function `expired-orders-feed` that uses its **service role** internally and returns only the fields needed for the Expired Orders table. No service-role key ever leaves B.
- A holds a thin proxy edge function so B's URL/API key live as **secrets in A**, never in the browser bundle.
- A's admin page just calls `supabase.functions.invoke('fetch-expired-orders-proxy')` exactly like any other edge function.

## What gets built

### In Project B (you/the user does this part, I'll provide the code)

1. **Edge function `expired-orders-feed`** (`verify_jwt = false`, gated by a shared secret header `x-feed-key`):
   - Queries `orders` (status = completed, completed_at not null) with `order_items`, `products(name)`, `product_variations(expiry_days)`, and `profiles(email, phone)`.
   - Flattens to the same row shape A's page already expects:
     ```
     { key, orderNumber, email, phone, product, createdAt, expiryDate, remaining, status }
     ```
   - Returns JSON. Computes `expiryDate = completed_at + expiry_days` and `remaining` server-side.
2. **Secret in B**: `EXPIRED_ORDERS_FEED_KEY` — a long random string. Same value goes into A.

### In Project A (I'll build this)

1. **Secrets** (added via `add_secret`):
   - `PROJECT_B_SUPABASE_URL` — B's project URL
   - `PROJECT_B_FEED_KEY` — same value as B's `EXPIRED_ORDERS_FEED_KEY`
2. **New edge function `fetch-expired-orders-proxy`**:
   - Verifies caller is an authenticated admin/editor of A (JWT).
   - Calls `${PROJECT_B_SUPABASE_URL}/functions/v1/expired-orders-feed` with header `x-feed-key: ${PROJECT_B_FEED_KEY}`.
   - Returns B's JSON to the client.
3. **Refactor `src/pages/admin/AdminExpiredOrders.tsx`**:
   - Replace the local `supabase.from('orders').select(...)` query with `supabase.functions.invoke('fetch-expired-orders-proxy')`.
   - The rest of the page (search, product filter, "Expired today" / "All", table rendering) stays identical because the row shape is unchanged.

### Out of scope (not changed)

- Other admin pages in A that show orders (Orders, Customers, Reports, License Keys, Family Sharing). You said *only* Expired Orders needs to read from B — those local pages keep using A's empty/test data unless you tell me otherwise later.
- Manual order creation UI — you said orders are created in B, so nothing to add here. If later you want a "Create order in B" form inside A, that's a separate feature.

## Security notes

- B's service role never leaves B. A only ever holds a shared API key that lets it hit *one* read-only endpoint.
- A's proxy enforces that only logged-in admins/editors can call it (so the feed key doesn't leak through public usage).
- The feed returns customer email/phone — same data A already shows on its existing Expired Orders page, so no new exposure.

## Steps after you approve

1. I add the secrets `PROJECT_B_SUPABASE_URL` and `PROJECT_B_FEED_KEY` to Project A (you'll paste the values).
2. I write A's `fetch-expired-orders-proxy` edge function.
3. I refactor `AdminExpiredOrders.tsx` to call the proxy.
4. I give you the **complete code for `expired-orders-feed`** to paste into Project B, plus the SQL/secret setup instructions for B.
5. You deploy on B → we test end-to-end.

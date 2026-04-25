# Cross-Project Sync: Project A → Project B

Project A = this project (toolsmandu).
Project B = `https://lovable.dev/projects/31ff25eb-45b4-4818-8015-2dc92bbeda7b` — currently empty.

## Two flows

### 1. WA Orders (button on Admin → Orders)

- New **"Add WA Order"** button next to "Add Order".
- Opens the **same form** as Add Order (customer search, product, variation, amount, payment, remarks).
- On Create: order is **inserted only into Project B**, nothing saved in A.
- Customer is picked from A's existing customers (so we have email/phone). The customer's `user_id` from A is sent to B along with email/phone — B stores them in its own profiles row (created on the fly if missing).

### 2. Product sync (automatic, realtime)

- DB triggers in A on `products`, `product_variations`, `categories` fire on INSERT / UPDATE / DELETE.
- Triggers call A's edge function `push-product-to-b` via `pg_net` (async HTTP).
- Edge function forwards the change (with operation type) to B's `receive-from-a` function.
- B upserts/deletes the row in its own table.

## Architecture

```
[Project A admin UI]                         [Project B]
  Admin → Orders                              orders, order_items,
   ├─ "Add Order"  (local insert)             products, variations, categories,
   └─ "Add WA Order" ─┐                       profiles
                      ▼
       supabase.functions.invoke(
         'push-wa-order-to-b'
       )                                              ▲
                      │                               │
[A edge functions]    └──HTTPS + x-push-key──► [B edge function]
  push-wa-order-to-b ─────────────────────────► receive-from-a
  push-product-to-b  ─────────────────────────►   (service-role,
       ▲                                            handles: order,
       │ pg_net                                     product, variation,
[A Postgres triggers]                              category)
  products, product_variations,
  categories  → INSERT/UPDATE/DELETE
```

## Project B schema (I'll provide the SQL for you to run)

Mirror tables only — no RLS-protected app code lives in B yet.

- `categories` (id, name, slug, icon, sort_order, created_at) — id stays the same as A.
- `products` (id, name, slug, description, price, original_price, duration, image_url, category_id, is_featured, is_bestseller, is_flash_sale, flash_sale_label, rating, meta_title, meta_description, stock_status, order_mode, region, features, created_at, updated_at) — id stays the same as A.
- `product_variations` (id, product_id, name, price, original_price, expiry_days, stock_status, has_special_input_fields, sort_order, is_active, variation_info, created_at).
- `profiles` (user_id, email, phone, name) — populated on-demand from incoming WA orders.
- `orders` (id, user_id, total, status, payment_status, payment_method, order_number, completed_at, refund_amount, created_at, updated_at) — `user_id` references B's profiles row that was just upserted.
- `order_items` (id, order_id, product_id, variation_id, variation_name, price, quantity, input_field_responses, created_at).

All ids are UUIDs and copied verbatim from A so future cross-references work.
RLS in B: deny-all from anon; only the receiver function (service role) writes.

## Edge functions

### In A

1. **`push-wa-order-to-b`** — admin/editor JWT required. Receives the form payload, looks up customer email/phone from A's `profiles`, POSTs to B's receiver with `type: "order"`.
2. **`push-product-to-b`** — called by DB trigger via pg_net (no JWT, gated by a separate trigger-only key + the shared push key). Body shape: `{ type: "product"|"variation"|"category", op: "insert"|"update"|"delete", row: {...} }`.

### In B (you paste; I'll provide the full code)

1. **`receive-from-a`** — `verify_jwt = false`, gated by header `x-push-key` matching B's secret. Dispatches on `type` + `op`:
   - `order` → upsert profile (by user_id), insert order + order_items.
   - `product` / `variation` / `category` → upsert or delete.

## Secrets

### In A (I'll request via add_secret)

- Already have: `PROJECT_B_SUPABASE_URL`, `PROJECT_B_FEED_KEY` (read direction).
- New: `PROJECT_B_PUSH_KEY` — shared with B, used by both push functions.

### In B (you set in B's dashboard)

- `PROJECT_A_PUSH_KEY` = same value as A's `PROJECT_B_PUSH_KEY`.

## Caveats I want you to know about up front

1. **No backfill**: existing products in A won't appear in B until you edit them. (You confirmed this is OK.)
2. **No retry queue**: if B is down when a trigger fires, the change is lost. If you want durability later, we can add a `sync_outbox` table in A.
3. **WA orders bypass A entirely** — they will NOT show up in A's orders list, A's reports, A's customer history, etc. The only record is in B. Confirming this is what you want.
4. **`pg_net` extension** must be enabled in A. I'll enable it in the migration.
5. **Trigger calls are async** (pg_net is fire-and-forget), so the admin UI won't see sync errors. Errors will only appear in the edge function logs.

## Build order

1. **A**: enable `pg_net`, add `PROJECT_B_PUSH_KEY` secret.
2. **A**: write `push-wa-order-to-b` and `push-product-to-b` edge functions.
3. **A**: create DB triggers on products / variations / categories that call `push-product-to-b`.
4. **A**: add "Add WA Order" button + reuse existing form, wire submit to `push-wa-order-to-b`.
5. **You**: run B's schema migration (I'll give you the SQL), create `receive-from-a` function in B, set `PROJECT_A_PUSH_KEY` secret in B.
6. **Test**: edit a product in A → check B. Create WA order in A → check B.

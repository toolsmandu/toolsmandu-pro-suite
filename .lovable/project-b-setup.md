# Project B Setup — paste these into Project B's Lovable chat

Project B = `https://lovable.dev/projects/31ff25eb-45b4-4818-8015-2dc92bbeda7b`

Open Project B in Lovable, then paste this **entire prompt** into the chat:

---

## Prompt to paste into Project B

> I need to receive product/order syncs from another Lovable project. Please do all of the following:
>
> 1. **Add a secret** named `PROJECT_A_PUSH_KEY` (I'll paste the value when you ask). It must equal Project A's `PROJECT_B_PUSH_KEY`.
>
> 2. **Run this database migration** to create mirror tables and a profiles table. All tables have RLS enabled with no public policies — only the edge function (service role) writes:
>
> ```sql
> -- Categories
> CREATE TABLE IF NOT EXISTS public.categories (
>   id uuid PRIMARY KEY,
>   name text NOT NULL,
>   slug text NOT NULL,
>   icon text,
>   sort_order integer NOT NULL DEFAULT 0,
>   created_at timestamptz NOT NULL DEFAULT now()
> );
> ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
>
> -- Products
> CREATE TABLE IF NOT EXISTS public.products (
>   id uuid PRIMARY KEY,
>   name text NOT NULL,
>   slug text NOT NULL,
>   description text,
>   price numeric NOT NULL,
>   original_price numeric,
>   duration text,
>   image_url text,
>   category_id uuid,
>   is_featured boolean DEFAULT false,
>   is_bestseller boolean DEFAULT false,
>   is_flash_sale boolean DEFAULT false,
>   flash_sale_label text,
>   rating numeric DEFAULT 0,
>   meta_title text,
>   meta_description text,
>   stock_status text NOT NULL DEFAULT 'in_stock',
>   order_mode text NOT NULL DEFAULT 'cart',
>   region text,
>   features jsonb DEFAULT '[]'::jsonb,
>   created_at timestamptz NOT NULL DEFAULT now(),
>   updated_at timestamptz NOT NULL DEFAULT now()
> );
> ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
>
> -- Product variations
> CREATE TABLE IF NOT EXISTS public.product_variations (
>   id uuid PRIMARY KEY,
>   product_id uuid NOT NULL,
>   name text NOT NULL,
>   price numeric NOT NULL,
>   original_price numeric,
>   expiry_days integer,
>   stock_status text NOT NULL DEFAULT 'in_stock',
>   has_special_input_fields boolean NOT NULL DEFAULT false,
>   sort_order integer NOT NULL DEFAULT 0,
>   is_active boolean NOT NULL DEFAULT true,
>   variation_info text,
>   created_at timestamptz NOT NULL DEFAULT now()
> );
> ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "Anyone can view variations" ON public.product_variations FOR SELECT USING (true);
>
> -- Lightweight profiles (no auth.users link — A owns auth)
> CREATE TABLE IF NOT EXISTS public.profiles (
>   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
>   user_id uuid UNIQUE NOT NULL,
>   email text,
>   phone text,
>   name text,
>   created_at timestamptz NOT NULL DEFAULT now()
> );
> ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
>
> -- Orders
> CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;
> CREATE TABLE IF NOT EXISTS public.orders (
>   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
>   user_id uuid NOT NULL,
>   order_number text NOT NULL DEFAULT (nextval('public.order_number_seq')::text),
>   total numeric NOT NULL DEFAULT 0,
>   status text NOT NULL DEFAULT 'processing',
>   payment_status text NOT NULL DEFAULT 'pending',
>   payment_method text NOT NULL DEFAULT 'manual',
>   completed_at timestamptz,
>   refund_amount numeric,
>   source text DEFAULT 'wa',
>   remarks text,
>   created_at timestamptz NOT NULL DEFAULT now(),
>   updated_at timestamptz NOT NULL DEFAULT now()
> );
> ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
>
> -- Order items
> CREATE TABLE IF NOT EXISTS public.order_items (
>   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
>   order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
>   product_id uuid,
>   variation_id uuid,
>   variation_name text,
>   price numeric NOT NULL,
>   quantity integer NOT NULL DEFAULT 1,
>   input_field_responses jsonb DEFAULT '[]'::jsonb,
>   created_at timestamptz NOT NULL DEFAULT now()
> );
> ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
> ```
>
> 3. **Create an edge function** named `receive-from-a` with `verify_jwt = false` (set this in `supabase/config.toml`). Code:
>
> ```typescript
> import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
>
> const corsHeaders = {
>   "Access-Control-Allow-Origin": "*",
>   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-key",
> };
>
> Deno.serve(async (req) => {
>   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
>
>   try {
>     const incomingKey = req.headers.get("x-push-key");
>     const expected = Deno.env.get("PROJECT_A_PUSH_KEY");
>     if (!expected || incomingKey !== expected) {
>       return new Response(JSON.stringify({ error: "Unauthorized" }), {
>         status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
>       });
>     }
>
>     const body = await req.json();
>     const { type, op, row, payload } = body;
>     const admin = createClient(
>       Deno.env.get("SUPABASE_URL")!,
>       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
>     );
>
>     // ----- Mirror tables -----
>     if (type === "category" || type === "product" || type === "variation") {
>       const tableMap: Record<string, string> = {
>         category: "categories", product: "products", variation: "product_variations",
>       };
>       const table = tableMap[type];
>       if (op === "delete") {
>         const { error } = await admin.from(table).delete().eq("id", row.id);
>         if (error) throw error;
>       } else {
>         // strip columns B doesn't have / shouldn't accept blindly (none in our mirror — schemas match)
>         const { error } = await admin.from(table).upsert(row);
>         if (error) throw error;
>       }
>       return new Response(JSON.stringify({ ok: true }), {
>         status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
>       });
>     }
>
>     // ----- WA Order -----
>     if (type === "order" && op === "insert" && payload) {
>       const { customer, order, items } = payload;
>       if (!customer?.user_id || !order || !Array.isArray(items)) {
>         return new Response(JSON.stringify({ error: "Invalid order payload" }), {
>           status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
>         });
>       }
>
>       // Upsert profile
>       const { error: profErr } = await admin.from("profiles").upsert({
>         user_id: customer.user_id,
>         email: customer.email,
>         phone: customer.phone,
>         name: customer.name,
>       }, { onConflict: "user_id" });
>       if (profErr) throw profErr;
>
>       // Insert order
>       const { data: orderRow, error: orderErr } = await admin.from("orders").insert({
>         user_id: customer.user_id,
>         total: order.total,
>         payment_method: order.payment_method,
>         status: "processing",
>         payment_status: "pending",
>         source: "wa",
>         remarks: order.remarks,
>         created_at: order.created_at,
>       }).select().single();
>       if (orderErr) throw orderErr;
>
>       // Insert items
>       const itemsToInsert = items.map((it: any) => ({
>         order_id: orderRow.id,
>         product_id: it.product_id,
>         variation_id: it.variation_id,
>         variation_name: it.variation_name,
>         price: it.price,
>         quantity: it.quantity,
>         input_field_responses: it.input_field_responses ?? [],
>       }));
>       const { error: itemsErr } = await admin.from("order_items").insert(itemsToInsert);
>       if (itemsErr) throw itemsErr;
>
>       return new Response(JSON.stringify({ ok: true, order_number: orderRow.order_number }), {
>         status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
>       });
>     }
>
>     return new Response(JSON.stringify({ error: "Unknown type/op" }), {
>       status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
>     });
>   } catch (e: any) {
>     console.error("receive-from-a error:", e);
>     return new Response(JSON.stringify({ error: e?.message || String(e) }), {
>       status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
>     });
>   }
> });
> ```
>
> 4. After everything is deployed, tell me when it's ready so I can test from Project A.

---

## Test plan (after Project B is set up)

1. In Project A admin, edit any product → check Project B database → product row should appear/update.
2. In Project A admin → Orders → click **Add WA Order** → fill form → Create.
3. Check Project B's `orders` and `order_items` tables for the new row.

## Troubleshooting

- **Triggers fire but nothing reaches B**: check edge function logs for `push-product-to-b` in Project A.
- **B returns 401**: the push key in B's `PROJECT_A_PUSH_KEY` doesn't match A's `PROJECT_B_PUSH_KEY`.
- **B returns "Could not find the table"**: B's migration didn't run.

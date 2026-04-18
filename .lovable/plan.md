
## Why the email shows "view expanded content" in Gmail

Gmail (and a few other inbox clients) collapses long emails behind a **"[Message clipped] View entire message"** link when:

1. The rendered HTML source is **larger than ~102 KB**, OR
2. The email contains **identical content to a previous email** in the thread (Gmail clips quoted content), OR
3. The message has **trailing whitespace / repeated structure** that Gmail thinks is a quoted reply.

Looking at our two order templates, the most likely cause is **#1 — HTML size**. React Email renders inline styles on every element, and our templates use:

- `@react-email/components` `<Section>`, `<Container>`, `<Hr>`, `<Button>` → each expands into nested `<table><tr><td>` with full inline style attributes (often 3–6 levels deep per Section).
- We have **8+ Sections** per email (brandBar, hero, amountCard, messageWrap, reminderWrap, detailsWrap, supportSection, footer).
- Long inline gradient + box-shadow strings repeated multiple times.
- The system-appended unsubscribe footer adds more HTML on top.
- Order Completed adds `dangerouslySetInnerHTML` admin message which can include `<p>`, `<strong>`, `<a>` tags — pushing closer to the limit.

The combined output likely crosses Gmail's 102 KB threshold, triggering the clipping.

## Fix Plan

Slim down the rendered HTML by reducing React Email's table nesting and consolidating styles. Concrete changes to **both** `new-order.tsx` and `order-completed.tsx`:

1. **Replace `<Section>` with plain `<div>` where possible.** `<Section>` always renders a full `<table><tbody><tr><td>`. A simple `<div style={...}>` cuts ~150 bytes per section. With 8 sections × 2 templates, this alone saves several KB.

2. **Remove unused styles** in `order-completed.tsx`: `amountCard`, `amountLabel`, `amountValue`, `pillWrap`, `pill`, `reviewWrap`, `reviewTitle`, `reviewText`, `btnRow`, `btnGoogle`, `btnTrustpilot`, `waCircle` are defined but never used. Dead code that still ships in the bundle (minor) — but more importantly, signals to clean up.

3. **Drop `<Hr>` in favor of a `<div>` with `borderTop`.** `<Hr>` renders a styled table row.

4. **Shorten the `boxShadow` and `gradient` strings** — long CSS values repeat in the output.

5. **Strip the Preview component if not essential** — it injects a hidden span with the preview text padded by zero-width spaces (~600 bytes of `&zwnj;&nbsp;` repeated).

6. **For `order-completed.tsx`: sanitize the admin message HTML** — strip `style=`, `class=`, and any unnecessary attributes from the rich-text editor output before injecting via `dangerouslySetInnerHTML`. Keep only `<p>`, `<strong>`, `<em>`, `<a href>`, `<br>`, `<ul>`, `<li>`. This both reduces size and prevents weird inline styles from the editor bloating the email.

7. **Redeploy** `send-transactional-email` and `preview-transactional-email`.

## Files to change

- `supabase/functions/_shared/transactional-email-templates/new-order.tsx`
- `supabase/functions/_shared/transactional-email-templates/order-completed.tsx`

## Verification

After deploying, place a real test order and check Gmail web — the "View entire message" link should be gone. As a secondary check, view the raw email source (Gmail → ⋮ → Show original) and confirm the HTML body is well under 102 KB.

## Note

If it turns out the size is already under 102 KB, the cause is likely **#2 — duplicate content in thread** (Gmail clips when the same order email is sent twice to the same recipient and threaded together). In that case the fix is to ensure each email subject/body has a unique element (e.g., always include the order ID in the subject — which we already do for some, will verify both).

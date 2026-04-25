## Goal

Add a new "Promo Codes" admin section (visible above Settings in the sidebar) where admins/editors can create, list, edit and delete promo codes tied to a product, with a rich-text instruction template that supports a `{code}` placeholder.

## Database

Create a new table `promo_codes` (separate from existing `coupons`, since this is a simpler entity):

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| product_id | uuid | references products.id (no FK enforced, like other tables) |
| code | text | the promo code value |
| remarks | text | nullable |
| instruction_template | text | rich HTML; may contain `{code}` placeholder |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS:
- `Anyone can view promo codes` — SELECT true (consistent with coupons)
- `Admins editors manage promo codes` — ALL using `has_role(admin)` or `has_role(editor)`

## Sidebar

In `src/pages/admin/AdminLayout.tsx`, insert a new top-level item **just above** the Settings section (after Waiting List), labeled "Promo Codes" with a `Megaphone` (or `Tag`) icon, linking to `/admin/promo-codes`. Visible to both admins and editors.

## New Page: `src/pages/admin/AdminPromoCodes.tsx`

Layout follows the existing `AdminCoupons.tsx` pattern (split list + side panel).

**Header**: "Promo Codes" title, search input (filters by code/product), "Add Promo Code" button.

**Add/Edit panel** with fields:
- Product (Select dropdown of all products by name) — required
- Promo Code (text) — required
- Remarks (text, optional)
- Instruction Template (RichTextEditor, reusing `src/components/admin/RichTextEditor.tsx`) — supports any HTML; a small helper note tells the admin "Use `{code}` where the promo code should appear."
- Save / Update button

**List table** with columns:
- Promo Code
- Product (joined name)
- Remarks
- Actions: Edit (pencil) and Delete (trash) icons

Clicking a row also opens the edit panel (matches Coupons UX).

## Routing

In `src/App.tsx`, add:
```tsx
<Route path="promo-codes" element={<AdminPromoCodes />} />
```
and import `AdminPromoCodes`.

## Notes on the `{code}` placeholder

The instruction template is stored as-is in the database. Whenever it is rendered to a user (future feature — e.g. on order completion email or product page), the system will replace `{code}` with the actual `code` value. For this task, we only persist the template and show a preview in the admin panel that already substitutes `{code}` with the entered code value, so the admin can verify the output.

## Files

- New migration: create `promo_codes` table + RLS policies
- New file: `src/pages/admin/AdminPromoCodes.tsx`
- Edit: `src/pages/admin/AdminLayout.tsx` (sidebar entry above Settings)
- Edit: `src/App.tsx` (route + import)

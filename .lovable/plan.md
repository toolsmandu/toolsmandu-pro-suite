

## Plan: Move Footer About Text & Add Edit for Footer Links

### Changes

**1. Move "Footer About Text" from Site Settings into the Footer Links card**
- In `AdminSettings.tsx`, remove the footer about text field from the "Site Settings" card
- Add it at the top of the "Footer Links" card so all footer content is managed together

**2. Add Edit functionality for Footer Links**
- Add edit state and an edit dialog (similar to how nav menu items already have edit)
- Add a Pencil/edit button in the Actions column of each footer link row
- Add an `updateLink` mutation that updates the footer link by ID
- Edit dialog has fields: Column, Label, URL, Sort Order

### Files to modify
- `src/pages/admin/AdminSettings.tsx` — move footer about textarea, add edit link dialog + mutation + edit button

No database changes needed — the `footer_links` table already supports updates via the admin RLS policy.


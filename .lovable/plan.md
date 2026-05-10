## Goal
Add a per-product "custom template" system. The first template — **Adobe-style** — will be applied to `/item/adobe-creative-cloud` and reusable for any future product. All content (hero copy, apps, features, plans) is editable from the admin panel.

## Database changes

**1. `products` table** — add one column:
- `custom_template` text default `'default'` — values: `'default'` | `'adobe_style'`. When not `'default'`, the custom layout renders instead of the standard product page.

**2. New table `product_custom_sections`** — stores section content per product:
- `product_id` (uuid)
- `section_type` text — `'hero'` | `'app_grid'` | `'features'` | `'plans'`
- `data` jsonb — section payload (see shapes below)
- `sort_order` int
- `is_active` boolean
- RLS: public read; admin/editor write

### `data` jsonb shapes per section_type

```text
hero       { eyebrow, heading, subheading, image_url, cta_label, cta_link, secondary_cta_label, secondary_cta_link, bg_color }
app_grid   { heading, apps: [{ name, icon_url, description }] }
features   { items: [{ heading, description, image_url, image_side: 'left'|'right' }] }
plans      { heading, plans: [{ name, price, period, badge?, features: string[], cta_label, cta_link, highlighted: bool }] }
```

## Frontend

### New components (in `src/components/product-templates/adobe/`)
- `AdobeTemplate.tsx` — orchestrator; fetches `product_custom_sections`, renders sections in order
- `AdobeHero.tsx` — full-bleed hero with eyebrow + big headline + dual CTAs + image
- `AdobeAppGrid.tsx` — responsive grid of app cards (icon + name + short desc)
- `AdobeFeatures.tsx` — alternating image/text rows (zigzag)
- `AdobePlans.tsx` — 3-column pricing comparison with highlight + checklist
- All themed with semantic tokens (no hardcoded colors), responsive, lazy-loaded images

### `src/pages/ProductPage.tsx`
- After product fetch: if `product.custom_template === 'adobe_style'`, render `<AdobeTemplate product={product} />` and bypass the default layout. Default page unchanged.

## Admin

### `src/pages/admin/AdminProductCustomTemplate.tsx` (new)
- Route: `/admin/products/:id/template`
- Template selector dropdown (Default / Adobe style) → updates `products.custom_template`
- When Adobe style is selected, show 4 collapsible section editors:
  - **Hero**: text inputs + image upload + CTA fields
  - **App Grid**: heading + repeater of {name, icon (image upload), description}
  - **Features**: repeater of {heading, description, image, side}
  - **Plans**: heading + repeater of {name, price, badge, feature list (textarea, one per line), CTA, highlighted toggle}
- Save writes to `product_custom_sections` (delete + reinsert per section_type for simplicity)

### `src/pages/admin/AdminProducts.tsx`
- Add a "Custom template" link/button on each product row pointing to the new editor

## Seeding
Pre-populate Adobe Creative Cloud product with sensible default content (hero, ~10 apps, 3 features, 3 plans) so the page looks complete immediately. User can then refine in admin.

## Out of scope
- Other templates (only Adobe style now; framework supports adding more later)
- Cart/checkout flow changes — CTAs link to existing cart or external URLs
- A/B testing or scheduling

## Verification
- Visit `/item/adobe-creative-cloud` → see Adobe-style page
- Visit any other product → unchanged default page
- Edit hero text in admin → reflects on refresh
- Mobile responsive at 375px and 1492px

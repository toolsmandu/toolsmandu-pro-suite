

# Redesign Product Page Layout (Matching Reference Design)

## Current State
The product page uses a 2-column grid: image on left, all details on right. Variations are not displayed — only a single "Add to Cart" button with the base product price.

## Target Design
Based on the reference at new.toolsmandu.com/product/adobe:
- **Left column**: Product image + title + category badge + description (stacked)
- **Right sidebar (sticky)**: "Select a Plan" card showing all product variations as selectable options, each with thumbnail, name, validity (expiry days), and price. An "Add to Cart" button at the bottom adds the selected variation.

## Plan

### 1. Redesign ProductPage.tsx layout

**Layout change**: Switch from `grid-cols-2` (image | details) to `grid-cols-[1fr_380px]` (content | sidebar).

**Left column** (top to bottom):
- Image (240px width on desktop) + title/category badge side by side (flex-row on md+)
- Description below (rendered as HTML with `dangerouslySetInnerHTML` if it contains HTML, or plain text)

**Right sidebar** (sticky card):
- Numbered heading: "1 Select a Plan"
- List of active `product_variations` as selectable buttons, each showing:
  - Product thumbnail (small)
  - Variation name (e.g. "1 Month")
  - Expiry days as "X Days Validity"
  - Price in NPR
  - Cart icon on the right
- Selected variation highlighted with primary border + background tint
- First variation auto-selected
- "Add to Cart" button at bottom that adds the selected variation

### 2. Update data fetching

- Add `product_variations(*)` to the product query so variations are available
- Add `useState` for `selectedVariant` (default to first active variation)

### 3. Update CartContext for variation support

- Modify `CartItem` to include optional `variantId` and `variantName` fields
- Update `addItem` to use `variantId` as the unique key (so different variations of the same product are separate cart items)
- Keep backward compatibility

### 4. Keep existing elements

- Breadcrumb navigation stays
- Out of stock handling stays
- Flash sale / bestseller badges stay (moved into the title area)
- Features list stays (below description)
- Related products section stays at bottom

### Files to modify
- `src/pages/ProductPage.tsx` — full layout redesign
- `src/contexts/CartContext.tsx` — add variant support to cart items


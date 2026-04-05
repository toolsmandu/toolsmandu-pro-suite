

# Visually Separate Variation Cards (Matching Reference Design)

## What Changes

Update the variation buttons in `src/pages/ProductPage.tsx` to match the reference screenshot from the other project — each variation gets a distinct card-like appearance with a larger cart icon container on the right.

## Changes in `src/pages/ProductPage.tsx`

**1. Increase spacing** between variations: `space-y-2` to `space-y-3`

**2. Enlarge the cart/tick icon area** on the right side — change from a small 6x6 circle (tick) or bare icon (cart) to a `w-10 h-10 rounded-lg` box with background color, matching the reference:
- Selected: `bg-[#f97015]` box with white check icon
- Unselected: `bg-white/10` box with muted cart icon

**3. Increase thumbnail size** from `w-10 h-10` to `w-12 h-12` with `rounded-md`

**4. Add padding** from `p-3` to `p-4` for more breathing room

**5. Add subtle background** to each variation button:
- Selected: add `bg-[#f97015]/10`
- Unselected: add `bg-white/5`

These changes create clear visual separation between each variation, matching the uploaded reference screenshot.

### File to modify
- `src/pages/ProductPage.tsx` (lines ~176-220)


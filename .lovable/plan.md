## Goal
Remove the background color behind the product image on homepage product cards. Keep the bottom section (product name, price, add-to-cart button) styled exactly as it is now (dark blue `#0a2e5c`).

## Change
In `src/components/ProductCard.tsx`, the image container currently uses `bg-secondary` which renders a colored background behind product images.

**Update the image wrapper:**
- Remove `bg-secondary` from the `aspect-square` div so the image area becomes transparent.
- Keep everything else (padding, `object-contain`, hover scale, badges) unchanged.
- Keep the bottom info section (`p-4` div with `backgroundColor: '#0a2e5c'`) exactly as it is.

### Snippet (before → after)
```tsx
// before
<div className="aspect-square bg-secondary flex items-center justify-center p-2">

// after
<div className="aspect-square flex items-center justify-center p-2">
```

No other files need changes.

## Align Product Info Card Width with Image & Adjust Border Radius

In `src/components/ProductCard.tsx`:

1. On the `Link` wrapper (line 50): remove `-mx-3` so image aligns to same width as info card.
2. On the image container `div` (line 51): change `w-auto` → `w-full`.
3. On the info card `div` (line 71): change `rounded-lg` → `rounded-b-lg` so only bottom corners are rounded (image keeps its top corners rounded, they meet flush in the middle).
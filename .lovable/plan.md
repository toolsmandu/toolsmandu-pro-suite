## Goal

Make the product page top banner image blend beautifully into the page (like the NordVPN reference) instead of looking like a flat fading rectangle.

## Changes

Single file: `src/pages/ProductPage.tsx` — replace the current banner `<div>` (lines 231–248) with a layered structure.

### Three combined effects

1. **Radial mask** — replace the top-to-bottom `linear-gradient` mask with a `radial-gradient` ellipse centered slightly above middle. Image is fully opaque in the center and fades to transparent on **all four sides** (top, bottom, left, right), so corners blend seamlessly into the page background.

2. **Brand color tint overlay** — a `#0a2e5c` (page blue) layer at 35% opacity with `mix-blend-mode: multiply` sits on top of the image. This pulls the image colors toward the page palette so it never looks foreign.

3. **Subtle blur + desaturation** — apply `filter: blur(2px) saturate(0.85)` on the image layer, plus a `scale(1.05)` to hide blur edges. Adds atmospheric depth without making the image unrecognizable.

### Structure

```text
<div mask=radial opacity=adminSlider>   ← radial fade wrapper
  <div bg-image filter=blur+saturate />  ← image layer
  <div bg=#0a2e5c blend=multiply 35% />  ← brand tint
</div>
```

The admin opacity slider continues to work as a master multiplier on the outer wrapper. Image URL still comes from the same `product_top_banner_image` site setting. No admin UI changes, no DB changes.

## Technical details

- Radial gradient: `radial-gradient(ellipse 75% 70% at 50% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.35) 75%, rgba(0,0,0,0) 100%)` for both `mask-image` and `-webkit-mask-image`.
- Outer wrapper gets `overflow-hidden` so the scaled blurred layer doesn't leak.
- Banner height stays at 720px; content `pt-[125px]` unchanged.
- Pure CSS — no new dependencies, no perf impact.

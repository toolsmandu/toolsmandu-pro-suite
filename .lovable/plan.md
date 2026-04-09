

## Problem

The HeroSlider shows a fallback "Premium Digital Subscriptions" template while the hero slides query is still loading (`slides` is undefined/empty during fetch). Once data arrives, it switches to the real slider — causing a visible flash.

The same issue applies to the categories/products section which shows nothing while loading.

## Plan

**File: `src/pages/Index.tsx`**

1. **HeroSlider**: Get `isLoading` from the `useQuery` call for hero slides. While loading, render a skeleton placeholder (matching the slider dimensions) instead of the fallback template. Only show the "Premium Digital Subscriptions" fallback when loading is done AND there are genuinely no slides.

2. **Index component**: Get `isLoading` from the products and categories queries. Show skeleton placeholders for category sections while data is loading.

This ensures no old/fallback template flashes before real content appears.

### Technical detail

```
// In HeroSlider:
const { data: slides, isLoading } = useQuery({ ... });

if (isLoading) return <div className="gradient-primary py-20"><Skeleton className="h-64 ..." /></div>;
if (!slides?.length) return <fallback>;

// In Index:
const { data: allProducts, isLoading: productsLoading } = useQuery({ ... });
const { data: categories, isLoading: categoriesLoading } = useQuery({ ... });

// Show skeletons while loading
```


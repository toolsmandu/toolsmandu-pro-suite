

# Remove Loading Skeletons

Remove all skeleton/loading states from these pages so content appears only when ready (no placeholder animations).

## Files to Modify

### 1. `src/pages/Index.tsx`
- Remove `ProductCardSkeleton` import
- Remove all `isLoading` conditional branches that render skeletons
- Only render sections when data is available (no loading fallback)
- Remove `animate-pulse` placeholder divs for category sections

### 2. `src/pages/ProductPage.tsx`
- Remove the `if (isLoading)` block that shows `animate-pulse` divs — return `null` instead

### 3. `src/pages/SearchPage.tsx`
- Remove `ProductCardSkeleton` import
- Remove skeleton grid in loading state — show nothing while loading

### 4. `src/pages/CategoryPage.tsx`
- Remove `ProductCardSkeleton` import
- Remove skeleton grid in loading state — show nothing while loading


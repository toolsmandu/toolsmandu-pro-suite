## Merge filters into single popover, place before "Add Product"

### Changes — `src/pages/admin/AdminProducts.tsx`

1. **Add 2 new filter states**: `newInStoreFilter`, `superSavingFilter` (default `all`).
2. **Extend `filteredProducts`** to also match `show_in_new_in_store` and `show_in_super_saving_deal`.
3. **Toolbar layout**: keep title on left; on the right place a **Filters** button (using existing `Popover`, `Filter` icon) with a count badge for active filters, immediately followed by the **Add Product** button. Search input stays on its own row below.
4. **Popover content** stacks all 5 filters vertically with labels:
   - Category, Stock Status, Order Mode (existing dropdowns)
   - New in Store Enabled (All / Enabled / Disabled)
   - Super Saving Deal Enabled (All / Enabled / Disabled)
   - "Reset filters" link to clear all to `all`.
5. Remove the old 3-select grid row.
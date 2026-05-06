# Convert Case Free Tool

Add a working Convert Case tool at `/free-tools/convert-case`, mirroring the core feature set of convertcase.net. The tool widget renders right after the **Tool Info** section on the page.

## What ships

A new free tool page with:
- **Title** (Convert Case) at the top
- **Tool Info** block (intro paragraph)
- **The tool itself** (interactive text editor)
- **Tool Description** (long-form content) below

The tool replicates these convertcase.net features:
- Live editor textarea
- Live counters: characters, words, lines
- Action buttons: Copy, Download (.txt), Clear
- Case conversion buttons:
  - Sentence case
  - lower case
  - UPPER CASE
  - Capitalized Case
  - aLtErNaTiNg cAsE
  - Title Case (smart — keeps minor words like "a/an/the/of/and" lowercase except first/last)
  - InVeRsE CaSe

(Skipping convertcase.net's extras: settings popover, share, ko-fi, browser-extension/app banners, and other generators — those aren't part of this request.)

## Files

- **Create** `src/components/free-tools/ConvertCaseTool.tsx` — interactive editor component (textarea, counters, action buttons, 7 case-conversion buttons; pure client-side string transforms).
- **Create** `src/pages/FreeToolDetail.tsx` — dynamic detail page that:
  - reads `:slug` from the route
  - fetches the matching `free_tools` row
  - renders: `Name` → `Tool Info` → tool widget (when slug is `convert-case`) → `Tool Description`
  - 404s if tool not found / inactive
- **Edit** `src/App.tsx` — add route `/free-tools/:slug` → `FreeToolDetail`.
- **Edit** `src/pages/FreeTools.tsx` — turn each tool name on the listing into a link to `/free-tools/{slug}` so the new page is reachable.

## Routing

```
/free-tools             → list of all active tools
/free-tools/convert-case → detail page with the live tool
```

The detail page is generic and keyed off slug, so future tools (added by admin) get the same layout. Only `convert-case` currently has an interactive widget; other tools show a "coming soon" placeholder until their widgets are built.

## Data

The Convert Case row already exists in `free_tools` (slug `convert-case`) with name, tool_info, tool_description, and SEO fields, so no migration or insert needed.

## Technical notes

- All case transforms run client-side — no API calls, no edge function.
- Title Case implementation: lowercase the string, then capitalize the first letter of every word except a known set of articles/conjunctions/short prepositions, while always capitalizing the first and last word.
- Inverse case: per-character swap of upper/lower.
- Alternating case: lower at even indices, upper at odd.
- Counters use `text.length`, `text.trim().split(/\s+/).length`, and `text.split(/\n/).length`.
- Copy uses `navigator.clipboard.writeText`; download builds a `Blob` and triggers an anchor click.
- Styling uses existing semantic tokens (`bg-card`, `border-border`, `bg-muted/30`, `text-foreground`, `text-muted-foreground`) and shadcn `Button` / `Textarea`.



User wants their site logo to appear in the auth email templates (signup, recovery, magic-link, invite, email-change, reauthentication). Currently all 6 templates render a text wordmark: "Toolsmandu" with blue "Tools" accent.

Logo source: `site_settings.logo_url` is stored in the DB and already used in Footer. But edge functions can't easily query DB on every render and even if they did, the logo URL needs to be a publicly accessible absolute URL (which Supabase Storage URLs are).

Two approaches:
1. Hardcode the logo URL into templates (simple, fast, but requires re-edit if logo changes)
2. Fetch logo URL from `site_settings` in the auth-email-hook and pass as prop to templates (dynamic, always in sync)

Approach 2 is better since user already manages logo in admin panel. The hook already has Supabase client access.

## Plan

**1. Update `auth-email-hook/index.ts`**
- Before rendering templates, query `site_settings` for `logo_url` key
- Pass `logoUrl` as a prop to all 6 templates (alongside existing props)
- Cache result for the request lifetime

**2. Update all 6 email templates** in `supabase/functions/_shared/email-templates/`:
- `signup.tsx`, `recovery.tsx`, `magic-link.tsx`, `invite.tsx`, `email-change.tsx`, `reauthentication.tsx`
- Add optional `logoUrl?: string` prop
- In the brand bar section, render `<Img>` (from @react-email/components) when `logoUrl` is provided, otherwise fall back to the existing "Toolsmandu" text wordmark
- Logo styling: max height ~40px, auto width, centered/left-aligned matching current brand bar

**3. Redeploy** `auth-email-hook` so changes take effect.

**4. Test** by triggering a signup OTP and verifying the email shows the logo.

The logo URL stored in `site_settings.logo_url` is already a public Supabase Storage URL, which works fine in emails (no auth needed, hot-linkable from Gmail/Outlook).

No DB migrations needed. No new secrets needed. No frontend changes needed.

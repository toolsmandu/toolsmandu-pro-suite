

## Fix Cloudflare Cache Purge Authentication

### Problem
Cloudflare returns `401 Authentication error` (code 10000). The `CLOUDFLARE_API_TOKEN` secret stored in the project is invalid or lacks the correct permissions.

### Root Cause
The Cloudflare API token either:
- Was created with incorrect permissions (needs **Zone > Cache Purge > Purge**)
- Is a **Global API Key** instead of an **API Token** (they use different auth headers)
- Has an incorrect value (typo, extra whitespace, or expired)

### Solution

**Step 1 — Support Global API Key auth method**

Update `supabase/functions/purge-cloudflare-cache/index.ts` to support both authentication methods:

- **API Token** (40+ character string): Uses `Authorization: Bearer <token>` header
- **Global API Key** (37-character hex string): Uses `X-Auth-Key` + `X-Auth-Email` headers

Add a new optional secret `CLOUDFLARE_AUTH_EMAIL` for Global API Key auth. Detect the token type automatically by its format and use the appropriate headers.

**Step 2 — Add `CLOUDFLARE_AUTH_EMAIL` secret (if needed)**

If the user is using a Global API Key (found in Cloudflare dashboard → My Profile → API Tokens → Global API Key), they will also need their Cloudflare account email stored as a secret.

**Step 3 — Improve error messaging**

Update the dashboard button's error toast to show clear instructions about which token type to use and how to create one with the correct permissions.

### Files changed
- `supabase/functions/purge-cloudflare-cache/index.ts` — support both API Token and Global API Key auth
- Potentially one new secret: `CLOUDFLARE_AUTH_EMAIL`


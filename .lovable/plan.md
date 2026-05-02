## Public Disposable Inbox System (Plan B) — toolsmandu

A catch-all inbox feature where users (and admins) can manually create email addresses on multiple custom domains, send/receive mail to them publicly, view inbox messages with attachments, and have everything auto-purged after 24 hours.

---

## How it works

```text
Sender → Cloudflare Email Routing (catch-all on each domain)
       → Cloudflare Worker (parses MIME, uploads attachments)
       → Edge Function `inbox-receive` (HMAC-verified webhook)
       → Database (inbox_addresses + inbox_messages + inbox_attachments)
       → Frontend polls / realtime → user reads message
       
Hourly cron → Edge Function `inbox-purge` → deletes >24h messages, attachments, and addresses
```

Multiple domains supported: each domain you add in admin gets its own MX records pointing at Cloudflare Email Routing. The Worker forwards everything to one edge function, which detects which domain the mail belongs to.

---

## What gets built

### 1. Database (new tables, all with RLS following existing `has_role` pattern)

- **`inbox_domains`** — `id, domain (unique), is_active, notes, created_at`
  - Admin-managed list of domains usable for inbox addresses.
- **`inbox_addresses`** — `id, local_part, domain_id, full_address (unique, generated), created_by (nullable for anon), created_at, expires_at`
  - Manual creation only (user types `local_part`, picks a `domain_id`). Validation: lowercase letters, numbers, hyphens; 3–32 chars.
- **`inbox_messages`** — `id, address_id, from_email, from_name, subject, text_body, html_body, received_at, expires_at, raw_size`
- **`inbox_attachments`** — `id, message_id, file_name, mime_type, size_bytes, storage_path, expires_at`

RLS: addresses, messages, attachments are **publicly readable** (since access model is fully public). Admin/editor full manage. Insert restricted to service role (webhook only). Delete restricted to service role + admin.

### 2. Storage

- Bucket **`inbox-attachments`** (public read, 24h TTL enforced by purge job).
- Max attachment size: 10 MB; total per message: 25 MB.

### 3. Edge functions

| Function | Purpose | `verify_jwt` |
|---|---|---|
| `inbox-receive` | Webhook from Cloudflare Worker. HMAC-verify, parse, insert message + attachments. | false (HMAC instead) |
| `inbox-purge` | Hourly cron. Delete messages, attachments, expired addresses past 24h. | false (cron only) |
| `inbox-create-address` | Validate + create a manual address. Checks uniqueness, domain active, format. | true (rate-limited per IP) |

`pg_cron` + `pg_net` schedules `inbox-purge` every hour.

### 4. Frontend pages

**Public**
- `/inbox` — Landing: "Create your disposable inbox". Form with `local_part` text input + domain dropdown (populated from active `inbox_domains`). Live availability check. Shows generated address + countdown to expiry.
- `/inbox/:address` — Inbox view. List of messages, click to open, view text/HTML body, download attachments. Auto-refresh every 10s + Supabase realtime subscription. "Copy address" + "Open in new window" + "Delete inbox" buttons.

**Customer dashboard** (`/dashboard/inbox`)
- Sidebar entry under existing items. Lists addresses created while logged in. Click → same inbox view. Convenience only — addresses are still public.

**Admin** (`/admin/disposable-inbox`)
- Sidebar entry under Knowledgebase.
- **Domains tab**: add/edit/disable/delete domains. Each row shows the MX records to configure (copy buttons).
- **Addresses tab**: search, filter by domain, see who created what, force-delete, view message count.
- **Messages tab**: global recent inbox, search by address/subject/sender, view raw, delete.
- Stats card: total messages last 24h, active addresses, attachments storage used.

### 5. Cloudflare Worker (provided as code + setup doc)

Single Worker file handling catch-all forwarding for all domains. Reads raw MIME via `message.raw`, parses with `postal-mime`, uploads attachments to a temp endpoint on the edge function, then POSTs JSON payload with HMAC signature header `x-inbox-signature`.

Setup steps documented in `/admin/disposable-inbox` "Setup guide" tab:
1. Add domain in Cloudflare → enable Email Routing.
2. Add MX + SPF + verification TXT records (records shown in admin UI).
3. Set catch-all rule → forward to Worker.
4. Deploy Worker (code provided; only env vars are `WEBHOOK_URL` + `WEBHOOK_SECRET`).
5. Mark domain "active" in admin.

### 6. Secrets needed

- `INBOX_WEBHOOK_SECRET` — HMAC secret shared with Worker.

(No new third-party API keys; Cloudflare Email Routing is free and you already use Cloudflare.)

---

## Decisions locked in

| Setting | Value |
|---|---|
| Inbound provider | Cloudflare Email Routing → Worker → Edge Function |
| Public access | Fully public (anyone with the address can read it) |
| Address creation | Manual: user types local-part + picks domain |
| Multiple domains | Yes, admin-manageable list |
| Retention | 24h for messages, attachments, and addresses |
| Attachments | Stored in `inbox-attachments` bucket for 24h |
| Realtime | Yes, on `inbox_messages` |

---

## Build order

1. Migration: 4 tables + enums + RLS + storage bucket + cron schedule.
2. Edge functions: `inbox-receive`, `inbox-create-address`, `inbox-purge`.
3. Public pages: `/inbox`, `/inbox/:address`.
4. Customer dashboard inbox tab.
5. Admin page with Domains / Addresses / Messages / Setup guide tabs + sidebar link.
6. Provide Cloudflare Worker code and step-by-step DNS instructions.
7. End-to-end test with one real domain.

---

## Out of scope

- Sending mail from disposable addresses (receive-only).
- Auto-generated addresses (manual only, per your decision).
- Authentication required to view inboxes.
- Spam filtering beyond size limits and attachment type allowlist.

Reply **approve** to switch to build mode and ship it.

## Tasks Module — Plan

A lightweight internal task management system inside the existing admin panel. Sidebar entry "Tasks" added just below "Knowledgebase".

### Roles & access
- Admin: full CRUD on tasks and templates, sees all tasks and dashboards.
- Editor: sees only tasks assigned to them. Can update status, add comments, mark complete/skipped.
- No Priority field (per your choice). One editor per task.

### Pages (under `/admin/tasks`)
1. `/admin/tasks` — Task list (admin sees all, editor sees own). Filters: assignee (admin only), status, date range, search. Toggle: list/calendar view.
2. `/admin/tasks/new` and `/admin/tasks/:id/edit` — Create/edit task (admin only).
3. `/admin/tasks/:id` — Task detail: status updates, comments, full activity history.
4. `/admin/tasks/recurring` — Recurring templates list (admin only). Pause/resume/stop/delete.
5. `/admin/tasks/dashboard` — Tasks dashboard with the cards below. (Admin sees global; editor sees personal "My Tasks Today / Upcoming / Overdue".)

The main `/admin` dashboard gets a small "My Tasks Today" widget for editors, and a "Pending / Overdue / Completed today" strip for admin.

### Dashboard cards
- Admin: total pending, overdue, completed (today/this week), tasks per editor (bar chart), today's tasks list, upcoming recurring instances (next 7 days).
- Editor: today's tasks, upcoming (next 7 days), overdue.

### Recurring task logic
- A recurring task is stored as a `task_templates` row with a recurrence rule (daily / weekly / monthly / every X days, plus start date and optional end date, plus paused flag).
- A scheduled edge function `tasks-generator` runs every 15 minutes and:
  - For each active template, generates the next pending task instance(s) up to a 7-day lookahead window if not already generated.
  - Marks any task past `due_at` and not in completed/skipped as `overdue`.
- Completing one instance does not affect the schedule. Missed instances stay in history with `overdue` status.

### Notifications & emails
- Edge function `tasks-notifier` runs every 15 minutes.
- 9:00 AM Asia/Kathmandu (cron in UTC = `15 3 * * *` for daily summary slot, but the same notifier handles it on its 15-min ticks and gates by time of day):
  - Send "Your tasks today" digest email to each editor with at least one task due today.
- Overdue alerts: when a task has been overdue for ≥ 24 hours and overdue alert not yet sent, email both the assigned editor and admin(s).
- Completion alert: when a task transitions to `completed`, queue an email to admin(s).
- All emails go through the existing `send-transactional-email` Edge Function (Lovable Emails). New templates registered:
  - `tasks-daily-digest`
  - `tasks-overdue-alert`
  - `tasks-completed-admin`
- Editable copy is also added to the existing `email_templates` table so admin can tweak subject/body in Settings → Email Templates.

### Activity log
Every state change (created, edited, reassigned, status changed, comment added, deleted, recurring template paused/resumed) is recorded in `task_activity_logs` with actor, timestamp, and a short detail string. Visible on the task detail page and (for admin) on a global activity tab.

### Database schema (new tables, all with RLS)
- `task_templates` — id, title, description, assigned_to (uuid), recurrence_type ('daily'|'weekly'|'monthly'|'every_x_days'), recurrence_interval (int, for every_x_days / weekly day count etc.), start_date, end_date (nullable), due_time (time of day), is_paused (bool), created_by, created_at, updated_at.
- `tasks` — id, template_id (nullable, set when generated from template), title, description, assigned_to (uuid, references auth user), status ('pending'|'in_progress'|'completed'|'skipped'|'overdue'), start_at, due_at (timestamptz), completed_at, overdue_alert_sent_at, created_by, created_at, updated_at.
- `task_comments` — id, task_id, author_id, body, created_at.
- `task_activity_logs` — id, task_id (nullable for template-level events), template_id (nullable), actor_id, action (text), details (text), created_at.

RLS pattern (mirrors existing `has_role` security-definer pattern):
- Admin (`has_role(auth.uid(),'admin')`): full ALL on every table.
- Editor: SELECT/UPDATE on `tasks` where `assigned_to = auth.uid()`. INSERT on `task_comments` for own tasks. SELECT on `task_activity_logs` for own tasks. SELECT on `task_templates` for templates whose `assigned_to = auth.uid()` (read-only).
- No customer access.

Status auto-update: a small DB trigger sets `completed_at` when status flips to `completed` (mirrors existing `set_order_completed_at` pattern). Overdue marking is done by the scheduled function (CHECK constraints can't reference `now()`).

### Edge functions (new)
- `tasks-generator` — generates upcoming task instances from active templates and marks overdue.
- `tasks-notifier` — sends daily 9am Kathmandu digest, 24h overdue alerts, and completion alerts. Uses `send-transactional-email`.
- Both scheduled via `pg_cron` + `pg_net` calling the function URL every 15 minutes (using project URL + anon key, inserted via the data tool, not migration, per Lovable rules).

### UI
- Reuses existing shadcn `Card`, `Table`, `Badge`, `Dialog`, `Calendar`, `Tabs`, `Select`, `Popover`, `Command` components.
- Status color coding via badge variants: pending (secondary), in_progress (default/blue), completed (green), skipped (muted), overdue (destructive).
- Mobile responsive — list collapses to cards under `md`.
- Calendar view uses existing `react-day-picker` Calendar with task dots.

### Sidebar
Add a new "Tasks" item in `AdminLayout` just below "Knowledgebase" using a `ListChecks` icon. Visible to both admin and editor (editor only sees their own tasks inside).

### Out of scope (will not build)
- Multiple assignees per task.
- Priority field and priority filter.
- Push/in-app notifications (only email).
- Customer-facing task views.

### Build order
1. Migration: enums, 4 tables, RLS, completed_at trigger.
2. Sidebar entry + routes + role guard.
3. Task list, create/edit, detail pages.
4. Recurring templates page.
5. Tasks dashboard + widget on main admin dashboard.
6. Edge functions `tasks-generator` and `tasks-notifier` + email templates + cron schedules.
7. Editable email copy in `email_templates` table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function nextOccurrence(template: any, fromDate: Date): Date | null {
  const interval = Math.max(1, template.recurrence_interval || 1);
  const start = new Date(template.start_date + 'T00:00:00Z');
  const end = template.end_date ? new Date(template.end_date + 'T23:59:59Z') : null;
  const last = template.last_generated_for ? new Date(template.last_generated_for + 'T00:00:00Z') : null;

  const base = last ? new Date(last) : new Date(start);
  if (last) {
    if (template.recurrence_type === 'daily') base.setUTCDate(base.getUTCDate() + 1);
    else if (template.recurrence_type === 'weekly') base.setUTCDate(base.getUTCDate() + 7);
    else if (template.recurrence_type === 'monthly') base.setUTCMonth(base.getUTCMonth() + 1);
    else if (template.recurrence_type === 'every_x_days') base.setUTCDate(base.getUTCDate() + interval);
  }

  if (base < start) base.setTime(start.getTime());
  if (end && base > end) return null;
  return base;
}

function buildDueAt(dateOnly: Date, due_time: string): string {
  // due_time format HH:MM or HH:MM:SS
  const [h, m] = due_time.split(':').map(Number);
  const d = new Date(dateOnly);
  d.setUTCHours(h, m || 0, 0, 0);
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Mark overdue
  const nowIso = new Date().toISOString();
  const { data: overdueUpdated } = await supabase
    .from('tasks')
    .update({ status: 'overdue' })
    .lt('due_at', nowIso)
    .in('status', ['pending', 'in_progress'])
    .select('id');

  // 2. Generate next instances (lookahead 7 days)
  const lookahead = new Date();
  lookahead.setDate(lookahead.getDate() + 7);

  const { data: templates } = await supabase
    .from('task_templates')
    .select('*')
    .eq('is_paused', false);

  let generated = 0;
  for (const t of templates || []) {
    // Generate up to 7 days ahead, multiple if needed
    let safety = 0;
    while (safety++ < 30) {
      const next = nextOccurrence(t, new Date());
      if (!next || next > lookahead) break;
      const dueAt = buildDueAt(next, t.due_time);

      // skip if a task already exists for this template at this due_at
      const { data: existing } = await supabase
        .from('tasks')
        .select('id')
        .eq('template_id', t.id)
        .eq('due_at', dueAt)
        .maybeSingle();
      if (!existing) {
        await supabase.from('tasks').insert({
          template_id: t.id,
          title: t.title,
          description: t.description,
          assigned_to: t.assigned_to,
          due_at: dueAt,
          created_by: t.created_by,
          status: 'pending',
        });
        generated++;
      }
      const dateStr = next.toISOString().slice(0, 10);
      await supabase.from('task_templates').update({ last_generated_for: dateStr }).eq('id', t.id);
      // refresh template last_generated_for in memory for the loop
      t.last_generated_for = dateStr;
    }
  }

  return new Response(JSON.stringify({
    overdue_marked: overdueUpdated?.length || 0,
    generated,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Asia/Kathmandu = UTC+5:45
function nepalNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (5 * 60 + 45) * 60 * 1000);
}

async function sendEmail(supabase: any, templateName: string, recipient: string, idemKey: string, data: Record<string, any>) {
  try {
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName,
        recipientEmail: recipient,
        idempotencyKey: idemKey,
        templateData: data,
      },
    });
  } catch (e) {
    console.error('email failed', templateName, recipient, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const summary: any = { digests: 0, overdue_alerts: 0, completion_alerts: 0 };

  const nepal = nepalNow();
  const isNineAmWindow = nepal.getUTCHours() === 9; // 9am Kathmandu (we'll send at the 9am hour ticks)

  // Find admin emails
  const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
  const adminIds = (adminRoles || []).map((r: any) => r.user_id);
  const { data: adminProfiles } = adminIds.length
    ? await supabase.from('profiles').select('user_id, email').in('user_id', adminIds)
    : { data: [] as any[] };
  const adminEmails: string[] = (adminProfiles || []).map((p: any) => p.email).filter(Boolean);

  // 1. Daily 9am Nepal digests (only one tick per day; gate by date marker in a setting row would be ideal,
  //    but we use idempotencyKey on the email side to dedupe).
  if (isNineAmWindow) {
    const today = nepal.toISOString().slice(0, 10);
    const startOfDayUtc = new Date(today + 'T00:00:00Z'); // approximate
    const endOfDayUtc = new Date(today + 'T23:59:59Z');

    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('id, title, assigned_to, due_at')
      .gte('due_at', startOfDayUtc.toISOString())
      .lte('due_at', endOfDayUtc.toISOString())
      .in('status', ['pending', 'in_progress']);

    const byUser: Record<string, any[]> = {};
    (todayTasks || []).forEach((t: any) => { (byUser[t.assigned_to] ||= []).push(t); });

    const userIds = Object.keys(byUser);
    if (userIds.length) {
      const { data: profs } = await supabase.from('profiles').select('user_id, email, name').in('user_id', userIds);
      for (const p of profs || []) {
        if (!p.email) continue;
        const tasks = byUser[p.user_id];
        const list = tasks.map((t: any) => `• ${t.title}`).join('\n');
        await sendEmail(supabase, 'tasks-daily-digest', p.email, `tasks-digest-${p.user_id}-${today}`, {
          name: p.name || '',
          count: tasks.length,
          taskList: list,
        });
        summary.digests++;
      }
    }
  }

  // 2. Overdue alerts (overdue >= 24h, alert not yet sent)
  const cutoff = new Date(); cutoff.setUTCHours(cutoff.getUTCHours() - 24);
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, due_at')
    .eq('status', 'overdue')
    .lt('due_at', cutoff.toISOString())
    .is('overdue_alert_sent_at', null);

  for (const t of overdueTasks || []) {
    const { data: editorProfile } = await supabase.from('profiles').select('email, name').eq('user_id', t.assigned_to).maybeSingle();
    const recipients = [editorProfile?.email, ...adminEmails].filter(Boolean);
    for (const r of recipients) {
      await sendEmail(supabase, 'tasks-overdue-alert', r, `tasks-overdue-${t.id}-${r}`, {
        title: t.title,
        dueAt: t.due_at,
      });
      summary.overdue_alerts++;
    }
    await supabase.from('tasks').update({ overdue_alert_sent_at: new Date().toISOString() }).eq('id', t.id);
  }

  // 3. Completion alerts to admin
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, completed_at')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .is('completion_alert_sent_at', null);

  for (const t of completedTasks || []) {
    const { data: editorProfile } = await supabase.from('profiles').select('name, email').eq('user_id', t.assigned_to).maybeSingle();
    for (const r of adminEmails) {
      await sendEmail(supabase, 'tasks-completed-admin', r, `tasks-completed-${t.id}-${r}`, {
        title: t.title,
        editorName: editorProfile?.name || editorProfile?.email || 'An editor',
      });
      summary.completion_alerts++;
    }
    await supabase.from('tasks').update({ completion_alert_sent_at: new Date().toISOString() }).eq('id', t.id);
  }

  return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

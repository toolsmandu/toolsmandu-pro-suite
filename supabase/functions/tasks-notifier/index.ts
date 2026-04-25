import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
  const summary: any = { overdue_alerts: 0, completion_alerts: 0 };

  // Find admin emails
  const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
  const adminIds = (adminRoles || []).map((r: any) => r.user_id);
  const { data: adminProfiles } = adminIds.length
    ? await supabase.from('profiles').select('user_id, email').in('user_id', adminIds)
    : { data: [] as any[] };
  const adminEmails: string[] = (adminProfiles || []).map((p: any) => p.email).filter(Boolean);

  // 1. Overdue alerts — fire as soon as a task is past its due date and not completed
  const nowIso = new Date().toISOString();
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, due_at, status')
    .lt('due_at', nowIso)
    .neq('status', 'completed')
    .is('overdue_alert_sent_at', null);

  for (const t of overdueTasks || []) {
    const { data: editorProfile } = await supabase.from('profiles').select('email, name').eq('user_id', t.assigned_to).maybeSingle();
    const assigneeName = editorProfile?.name || editorProfile?.email || 'Editor';
    const recipients = Array.from(new Set([editorProfile?.email, ...adminEmails].filter(Boolean)));
    for (const r of recipients) {
      await sendEmail(supabase, 'tasks-overdue-alert', r, `tasks-overdue-${t.id}-${r}`, {
        title: t.title,
        dueAt: t.due_at,
        assigneeName,
      });
      summary.overdue_alerts++;
    }
    await supabase.from('tasks').update({ overdue_alert_sent_at: new Date().toISOString() }).eq('id', t.id);
  }

  // 2. Completion alerts to admin
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, completed_at')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .is('completion_alert_sent_at', null);

  for (const t of completedTasks || []) {
    const { data: editorProfile } = await supabase.from('profiles').select('name, email').eq('user_id', t.assigned_to).maybeSingle();
    const editorName = editorProfile?.name || editorProfile?.email || 'An editor';
    for (const r of adminEmails) {
      await sendEmail(supabase, 'tasks-completed-admin', r, `tasks-completed-${t.id}-${r}`, {
        title: t.title,
        editorName,
        completedAt: t.completed_at,
      });
      summary.completion_alerts++;
    }
    await supabase.from('tasks').update({ completion_alert_sent_at: new Date().toISOString() }).eq('id', t.id);
  }

  return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

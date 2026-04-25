import { supabase } from '@/integrations/supabase/client';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'every_x_days';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  skipped: 'Skipped',
  overdue: 'Overdue',
};

export const STATUS_VARIANT: Record<TaskStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  skipped: 'outline',
  overdue: 'destructive',
};

export const STATUS_CLASS: Record<TaskStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  skipped: 'bg-muted text-muted-foreground',
  overdue: 'bg-red-100 text-red-800 border-red-200',
};

export const RECURRENCE_LABEL: Record<RecurrenceType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  every_x_days: 'Every X days',
};

export async function logActivity(
  taskId: string | null,
  templateId: string | null,
  actorId: string,
  action: string,
  details?: string,
) {
  await supabase.from('task_activity_logs').insert({
    task_id: taskId,
    template_id: templateId,
    actor_id: actorId,
    action,
    details: details || null,
  });
}

export function isOverdue(due_at: string, status: TaskStatus) {
  if (status === 'completed' || status === 'skipped') return false;
  return new Date(due_at).getTime() < Date.now();
}

export function effectiveStatus(due_at: string, status: TaskStatus): TaskStatus {
  if (status === 'pending' && isOverdue(due_at, status)) return 'overdue';
  return status;
}

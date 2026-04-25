import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { logActivity, RECURRENCE_LABEL, RecurrenceType } from './taskHelpers';

const AdminTaskEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = id && id !== 'new';

  const [taskType, setTaskType] = useState<'one_time' | 'recurring'>('one_time');
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '',
    start_at: '', due_at: '',
    recurrence_type: 'daily' as RecurrenceType,
    recurrence_interval: 1,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    due_time: '17:00',
  });

  useEffect(() => {
    if (!isAdmin) navigate('/admin/tasks');
  }, [isAdmin, navigate]);

  const { data: editors } = useQuery({
    queryKey: ['editors-list'],
    queryFn: async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id').in('role', ['editor', 'admin']);
      const ids = Array.from(new Set((roles || []).map((r: any) => r.user_id)));
      if (!ids.length) return [];
      const { data: profs } = await supabase.from('profiles').select('user_id, name, email').in('user_id', ids);
      return profs || [];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ['task', id],
    enabled: !!isEdit,
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('*').eq('id', id!).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setTaskType('one_time');
      setForm(f => ({
        ...f,
        title: existing.title,
        description: existing.description || '',
        assigned_to: existing.assigned_to,
        start_at: existing.start_at ? existing.start_at.slice(0, 16) : '',
        due_at: existing.due_at.slice(0, 16),
      }));
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!form.title.trim() || !form.assigned_to) throw new Error('Title and assignee are required');

      if (taskType === 'one_time') {
        if (!form.due_at) throw new Error('Due date is required');
        if (isEdit) {
          const { error } = await supabase.from('tasks').update({
            title: form.title,
            description: form.description || null,
            assigned_to: form.assigned_to,
            start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
            due_at: new Date(form.due_at).toISOString(),
          }).eq('id', id!);
          if (error) throw error;
          await logActivity(id!, null, user.id, 'updated', `Task "${form.title}" updated`);
        } else {
          const { data, error } = await supabase.from('tasks').insert({
            title: form.title,
            description: form.description || null,
            assigned_to: form.assigned_to,
            start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
            due_at: new Date(form.due_at).toISOString(),
            created_by: user.id,
            status: 'pending',
          }).select('id').single();
          if (error) throw error;
          await logActivity(data.id, null, user.id, 'created', `Task "${form.title}" created`);
        }
      } else {
        // recurring template
        const { data, error } = await supabase.from('task_templates').insert({
          title: form.title,
          description: form.description || null,
          assigned_to: form.assigned_to,
          recurrence_type: form.recurrence_type,
          recurrence_interval: Math.max(1, form.recurrence_interval),
          start_date: form.start_date,
          end_date: form.end_date || null,
          due_time: form.due_time,
          created_by: user.id,
        }).select('id').single();
        if (error) throw error;
        await logActivity(null, data.id, user.id, 'template_created', `Recurring template "${form.title}" created`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast.success('Saved');
      navigate(taskType === 'recurring' ? '/admin/tasks/recurring' : '/admin/tasks');
    },
    onError: (e: any) => toast.error(e.message || 'Save failed'),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Task' : 'New Task'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEdit && (
            <div>
              <Label>Task type</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant={taskType === 'one_time' ? 'default' : 'outline'} size="sm" onClick={() => setTaskType('one_time')}>One-time</Button>
                <Button type="button" variant={taskType === 'recurring' ? 'default' : 'outline'} size="sm" onClick={() => setTaskType('recurring')}>Recurring</Button>
              </div>
            </div>
          )}

          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Update product images" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>

          <div>
            <Label>Assigned to *</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
              <option value="">Select editor...</option>
              {editors?.map((e: any) => <option key={e.user_id} value={e.user_id}>{e.name || e.email}</option>)}
            </select>
          </div>

          {taskType === 'one_time' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start date/time</Label>
                <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div>
                <Label>Due date/time *</Label>
                <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Recurrence</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.recurrence_type} onChange={(e) => setForm({ ...form, recurrence_type: e.target.value as RecurrenceType })}>
                    {(['daily', 'weekly', 'monthly', 'every_x_days'] as RecurrenceType[]).map(r => (
                      <option key={r} value={r}>{RECURRENCE_LABEL[r]}</option>
                    ))}
                  </select>
                </div>
                {form.recurrence_type === 'every_x_days' && (
                  <div>
                    <Label>Every X days</Label>
                    <Input type="number" min={1} value={form.recurrence_interval} onChange={(e) => setForm({ ...form, recurrence_interval: Number(e.target.value) })} />
                  </div>
                )}
                <div>
                  <Label>Start date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>End date (optional)</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
                <div>
                  <Label>Due time (each occurrence)</Label>
                  <Input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Recurring task instances are generated automatically by the scheduler.</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaskEditor;

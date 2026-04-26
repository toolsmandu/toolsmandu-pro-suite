import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Pause, Play, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { RECURRENCE_LABEL, logActivity } from './taskHelpers';

const AdminTaskRecurring = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => { if (!isAdmin) navigate('/admin/tasks'); }, [isAdmin, navigate]);

  const { data: templates } = useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('task_templates').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: editors } = useQuery({
    queryKey: ['editors-list-recurring'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name, email');
      return data || [];
    },
  });
  const profById: Record<string, any> = {};
  editors?.forEach((p: any) => { profById[p.user_id] = p; });

  const togglePause = useMutation({
    mutationFn: async (t: any) => {
      const { error } = await supabase.from('task_templates').update({ is_paused: !t.is_paused }).eq('id', t.id);
      if (error) throw error;
      if (user) await logActivity(null, t.id, user.id, t.is_paused ? 'template_resumed' : 'template_paused');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['task-templates'] }); toast.success('Updated'); },
  });

  const deleteTpl = useMutation({
    mutationFn: async (t: any) => {
      const { error } = await supabase.from('task_templates').delete().eq('id', t.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['task-templates'] }); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tasks')}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-2xl font-semibold">Recurring Templates</h1>
        </div>
        <Button asChild><a href="/admin/tasks/new"><Plus className="h-4 w-4 mr-1" />New Task</a></Button>
      </div>

      <Card>
        {templates?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No recurring templates yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Recurrence</TableHead>
                <TableHead>Due time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{profById[t.assigned_to]?.name || profById[t.assigned_to]?.email || '—'}</TableCell>
                  <TableCell>{RECURRENCE_LABEL[t.recurrence_type as keyof typeof RECURRENCE_LABEL]}{t.recurrence_type === 'every_x_days' ? ` (${t.recurrence_interval})` : ''}</TableCell>
                  <TableCell>{t.due_time}</TableCell>
                  <TableCell>{t.is_paused ? <Badge variant="outline">Paused</Badge> : <Badge>Active</Badge>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => togglePause.mutate(t)}>
                      {t.is_paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete this recurring template? Generated tasks will remain.')) deleteTpl.mutate(t); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminTaskRecurring;

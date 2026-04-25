import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { STATUS_CLASS, STATUS_LABEL, TaskStatus, effectiveStatus, logActivity } from './taskHelpers';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const STATUSES: TaskStatus[] = ['pending', 'completed'];

const AdminTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('*').eq('id', id!).maybeSingle();
      return data;
    },
  });

  const { data: assigneeProfile } = useQuery({
    queryKey: ['profile', task?.assigned_to],
    enabled: !!task?.assigned_to,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('name, email').eq('user_id', task!.assigned_to).maybeSingle();
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ['task-comments', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from('task_comments').select('*').eq('task_id', id!).order('created_at', { ascending: true });
      return data || [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ['task-activity', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from('task_activity_logs').select('*').eq('task_id', id!).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const actorIds = Array.from(new Set((activity || []).map((a: any) => a.actor_id).filter(Boolean)));
  const { data: actorProfiles } = useQuery({
    queryKey: ['task-activity-actors', id, actorIds.join(',')],
    enabled: actorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name, email').in('user_id', actorIds);
      const map: Record<string, { name: string | null; email: string | null }> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = { name: p.name, email: p.email }; });
      return map;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: TaskStatus) => {
      if (!user || !task) return;
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
      if (error) throw error;
      await logActivity(task.id, null, user.id, 'status_changed', `${task.status} → ${newStatus}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['task-activity', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      toast.success('Status updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user || !task || !comment.trim()) return;
      const { error } = await supabase.from('task_comments').insert({ task_id: task.id, author_id: user.id, body: comment.trim() });
      if (error) throw error;
      await logActivity(task.id, null, user.id, 'comment_added');
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['task-comments', id] });
      queryClient.invalidateQueries({ queryKey: ['task-activity', id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      if (!task) return;
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task deleted');
      navigate('/admin/tasks');
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !task) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const eff = effectiveStatus(task.due_at, task.status);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={STATUS_CLASS[eff]}>{STATUS_LABEL[eff]}</Badge>
              <span className="text-sm text-muted-foreground">Due: {formatDate(task.due_at)}</span>
              {task.template_id && <Badge variant="outline">Recurring</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" asChild><Link to={`/admin/tasks/${task.id}/edit`}>Edit</Link></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTask.mutate()}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && <p className="text-sm whitespace-pre-wrap">{task.description}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><div className="text-muted-foreground text-xs">Assigned to</div>{assigneeProfile?.name || assigneeProfile?.email || '—'}</div>
            <div><div className="text-muted-foreground text-xs">Start</div>{task.start_at ? formatDate(task.start_at) : '—'}</div>
            <div><div className="text-muted-foreground text-xs">Completed</div>{task.completed_at ? formatDate(task.completed_at) : '—'}</div>
            <div><div className="text-muted-foreground text-xs">Created</div>{formatDate(task.created_at)}</div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Update status</div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <Button key={s} size="sm" variant={task.status === s ? 'default' : 'outline'} onClick={() => updateStatus.mutate(s)} disabled={updateStatus.isPending}>
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Comments</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {comments?.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          {comments?.map((c: any) => (
            <div key={c.id} className="text-sm border-l-2 border-muted pl-3">
              <div className="text-xs text-muted-foreground">{formatDate(c.created_at)}</div>
              <div className="whitespace-pre-wrap">{c.body}</div>
            </div>
          ))}
          <div className="flex gap-2">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note..." rows={2} />
            <Button onClick={() => addComment.mutate()} disabled={!comment.trim() || addComment.isPending}>Post</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {activity?.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          {activity?.map((a: any) => {
            const actor = a.actor_id ? actorProfiles?.[a.actor_id] : null;
            const actorLabel = actor?.email || actor?.name || (a.actor_id ? 'Unknown' : 'System');
            return (
              <div key={a.id} className="text-sm flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-border/50 py-2">
                <span>
                  <span className="font-medium">{a.action}</span>
                  {a.details ? ` — ${a.details}` : ''}
                  <span className="block text-xs text-muted-foreground mt-0.5">Created by: {actorLabel}</span>
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(a.created_at)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaskDetail;

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STATUS_CLASS, STATUS_LABEL, effectiveStatus } from './taskHelpers';
import { formatDate } from '@/lib/formatDate';

const AdminTaskDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: tasks } = useQuery({
    queryKey: ['dashboard-tasks', isAdmin, user?.id],
    queryFn: async () => {
      let q = supabase.from('tasks').select('*');
      if (!isAdmin && user) q = q.eq('assigned_to', user.id);
      const { data } = await q.order('due_at', { ascending: true });
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-dashboard'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name, email');
      return data || [];
    },
  });
  const profById: Record<string, any> = {};
  profiles?.forEach((p: any) => { profById[p.user_id] = p; });

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1);
    const in7 = new Date(startToday); in7.setDate(in7.getDate() + 7);

    const result = { pending: 0, overdue: 0, completed_today: 0, today: [] as any[], upcoming: [] as any[], overdueList: [] as any[] };
    (tasks || []).forEach((t: any) => {
      const eff = effectiveStatus(t.due_at, t.status);
      const due = new Date(t.due_at);
      if (eff === 'pending' || eff === 'in_progress') result.pending++;
      if (eff === 'overdue') { result.overdue++; result.overdueList.push(t); }
      if (t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= startToday && new Date(t.completed_at) < endToday) result.completed_today++;
      if (due >= startToday && due < endToday && eff !== 'completed' && eff !== 'skipped') result.today.push(t);
      if (due >= endToday && due < in7 && eff !== 'completed' && eff !== 'skipped') result.upcoming.push(t);
    });
    return result;
  }, [tasks]);

  const byEditor = useMemo(() => {
    if (!isAdmin) return [];
    const map: Record<string, { user_id: string; name: string; pending: number; overdue: number; completed: number }> = {};
    (tasks || []).forEach((t: any) => {
      const p = profById[t.assigned_to];
      const name = p?.name || p?.email || 'Unknown';
      if (!map[t.assigned_to]) map[t.assigned_to] = { user_id: t.assigned_to, name, pending: 0, overdue: 0, completed: 0 };
      const eff = effectiveStatus(t.due_at, t.status);
      if (eff === 'overdue') map[t.assigned_to].overdue++;
      else if (eff === 'completed') map[t.assigned_to].completed++;
      else map[t.assigned_to].pending++;
    });
    return Object.values(map);
  }, [tasks, isAdmin, profiles]);

  const renderTaskRow = (t: any) => {
    const eff = effectiveStatus(t.due_at, t.status);
    return (
      <Link key={t.id} to={`/admin/tasks/${t.id}`} className="flex items-center justify-between text-sm py-2 border-b last:border-0 hover:bg-muted/30 px-2 -mx-2 rounded">
        <div className="flex-1 truncate">
          <div className="font-medium truncate">{t.title}</div>
          <div className="text-xs text-muted-foreground">Due {formatDate(t.due_at)}</div>
        </div>
        <Badge variant="outline" className={STATUS_CLASS[eff]}>{STATUS_LABEL[eff]}</Badge>
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tasks')}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        <h1 className="text-2xl font-semibold">Tasks Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />Pending</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.pending}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Overdue</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-destructive">{stats.overdue}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Completed today</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.completed_today}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Today's tasks</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.today.length}</CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Today</CardTitle></CardHeader>
          <CardContent>{stats.today.length === 0 ? <p className="text-sm text-muted-foreground">Nothing due today.</p> : stats.today.map(renderTaskRow)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Upcoming (next 7 days)</CardTitle></CardHeader>
          <CardContent>{stats.upcoming.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming tasks.</p> : stats.upcoming.slice(0, 10).map(renderTaskRow)}</CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Overdue</CardTitle></CardHeader>
          <CardContent>{stats.overdueList.length === 0 ? <p className="text-sm text-muted-foreground">No overdue tasks. 🎉</p> : stats.overdueList.map(renderTaskRow)}</CardContent>
        </Card>

        {isAdmin && byEditor.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">By editor</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {byEditor.map(b => (
                <div key={b.user_id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                  <div className="font-medium">{b.name}</div>
                  <div className="flex gap-3 text-xs">
                    <span>Pending: <strong>{b.pending}</strong></span>
                    <span className="text-destructive">Overdue: <strong>{b.overdue}</strong></span>
                    <span className="text-emerald-700">Completed: <strong>{b.completed}</strong></span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminTaskDashboard;

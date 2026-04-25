import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Repeat, Search, ListChecks, AlertTriangle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { STATUS_CLASS, STATUS_LABEL, TaskStatus, effectiveStatus } from './taskHelpers';
import { formatDateTime } from '@/lib/formatDate';

const STATUSES: TaskStatus[] = ['pending', 'overdue', 'completed'];

const AdminTasksList = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: editors } = useQuery({
    queryKey: ['editors-and-admins'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('role', ['editor', 'admin']);
      const ids = Array.from(new Set((roles || []).map((r: any) => r.user_id)));
      if (!ids.length) return [];
      const { data: profs } = await supabase.from('profiles').select('user_id, name, email').in('user_id', ids);
      return profs || [];
    },
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['admin-tasks', isAdmin, user?.id],
    queryFn: async () => {
      let q = supabase.from('tasks').select('*').order('due_at', { ascending: true });
      if (!isAdmin && user) q = q.eq('assigned_to', user.id);
      const { data } = await q;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1);
    const result = { pending: 0, overdue: 0, completed_today: 0, today_count: 0 };
    (tasks || []).forEach((t: any) => {
      const eff = effectiveStatus(t.due_at, t.status);
      const due = new Date(t.due_at);
      if (eff === 'pending' || eff === 'in_progress') result.pending++;
      if (eff === 'overdue') result.overdue++;
      if (t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= startToday && new Date(t.completed_at) < endToday) result.completed_today++;
      if (due >= startToday && due < endToday && eff !== 'completed' && eff !== 'skipped') result.today_count++;
    });
    return result;
  }, [tasks]);

  const filtered = useMemo(() => {
    return (tasks || []).filter((t: any) => {
      const eff = effectiveStatus(t.due_at, t.status);
      if (statusFilter !== 'all' && eff !== statusFilter) return false;
      if (assigneeFilter !== 'all' && t.assigned_to !== assigneeFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, statusFilter, assigneeFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">{isAdmin ? 'All team tasks' : 'My assigned tasks'}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Button variant="outline" asChild><Link to="/admin/tasks/recurring"><Repeat className="h-4 w-4 mr-1" />Recurring</Link></Button>}
          {isAdmin && <Button asChild><Link to="/admin/tasks/new"><Plus className="h-4 w-4 mr-1" />New Task</Link></Button>}
        </div>
      </div>

      {/* Dashboard at top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />Pending</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Overdue</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">{stats.overdue}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Completed today</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.completed_today}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Today's tasks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.today_count}</CardContent>
        </Card>
      </div>

      {/* Search + filters */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title..." className="pl-8" />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        {isAdmin && (
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value="all">All editors</option>
            {editors?.map((e: any) => <option key={e.user_id} value={e.user_id}>{e.name || e.email}</option>)}
          </select>
        )}
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No tasks found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t: any) => {
                const eff = effectiveStatus(t.due_at, t.status);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link to={`/admin/tasks/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate" title={t.description || ''}>
                      {t.description || '—'}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_CLASS[eff]}>{STATUS_LABEL[eff]}</Badge></TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDateTime(t.due_at)}</TableCell>
                    <TableCell className="text-sm">{t.template_id ? 'Recurring' : 'One-time'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/tasks/${t.id}`)}
                        title="View, comment or mark complete"
                      >
                        <Eye className="h-4 w-4 mr-1" />View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminTasksList;

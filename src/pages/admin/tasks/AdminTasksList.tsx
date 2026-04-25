import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Repeat, LayoutDashboard, Search } from 'lucide-react';
import { STATUS_CLASS, STATUS_LABEL, TaskStatus, effectiveStatus } from './taskHelpers';
import { formatDate } from '@/lib/formatDate';

const STATUSES: TaskStatus[] = ['pending', 'overdue', 'completed'];

const AdminTasksList = () => {
  const { user, isAdmin } = useAuth();
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

  const profilesById = useMemo(() => {
    const map: Record<string, { name?: string; email?: string }> = {};
    editors?.forEach((p: any) => { map[p.user_id] = { name: p.name, email: p.email }; });
    return map;
  }, [editors]);

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
          <Button variant="outline" asChild><Link to="/admin/tasks/dashboard"><LayoutDashboard className="h-4 w-4 mr-1" />Dashboard</Link></Button>
          {isAdmin && <Button variant="outline" asChild><Link to="/admin/tasks/recurring"><Repeat className="h-4 w-4 mr-1" />Recurring</Link></Button>}
          {isAdmin && <Button asChild><Link to="/admin/tasks/new"><Plus className="h-4 w-4 mr-1" />New Task</Link></Button>}
        </div>
      </div>

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
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t: any) => {
                const eff = effectiveStatus(t.due_at, t.status);
                const p = profilesById[t.assigned_to];
                return (
                  <TableRow key={t.id} className="cursor-pointer">
                    <TableCell>
                      <Link to={`/admin/tasks/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
                    </TableCell>
                    <TableCell className="text-sm">{p?.name || p?.email || '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_CLASS[eff]}>{STATUS_LABEL[eff]}</Badge></TableCell>
                    <TableCell className="text-sm">{formatDate(t.due_at)}</TableCell>
                    <TableCell className="text-sm">{t.template_id ? 'Recurring' : 'One-time'}</TableCell>
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

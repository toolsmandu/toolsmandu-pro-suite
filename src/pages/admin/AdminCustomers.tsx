import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-destructive/20 text-destructive',
  editor: 'bg-warning/20 text-warning',
  customer: 'bg-success/20 text-success',
};

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: roles } = await supabase.from('user_roles').select('*');
      return profiles?.map(p => ({
        ...p,
        roles: roles?.filter(r => r.user_id === p.user_id).map(r => r.role) || [],
      })) || [];
    },
  });

  const filteredUsers = useMemo(() => {
    return (users || []).filter((u: any) => {
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const email = u.email?.toLowerCase() || '';
        const phone = u.phone?.toLowerCase() || '';
        const name = u.name?.toLowerCase() || '';
        if (!email.includes(term) && !phone.includes(term) && !name.includes(term)) return false;
      }
      if (roleFilter !== 'all') {
        if (!u.roles.includes(roleFilter)) return false;
      }
      return true;
    });
  }, [users, searchTerm, roleFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Customers</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name, email, phone" className="pl-9" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClassName}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-12rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">{u.name || '-'}</TableCell>
                  <TableCell className="text-foreground">{u.email || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{u.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {u.roles.map((role: string) => (
                        <Badge key={role} variant="secondary" className={`text-xs capitalize ${roleBadgeColors[role] || ''}`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;

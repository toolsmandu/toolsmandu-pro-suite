import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Eye, Pencil, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/formatDate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

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
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Add customer dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });

  // View dialog
  const [viewUser, setViewUser] = useState<any>(null);
  const [viewOrders, setViewOrders] = useState<any[]>([]);
  const [viewTickets, setViewTickets] = useState<any[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  // Edit dialog
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '', emailConfirmed: false, is_suspended: false, role: 'customer' });


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
      if (statusFilter !== 'all') {
        if (statusFilter === 'suspended' && !u.is_suspended) return false;
        if (statusFilter === 'active' && u.is_suspended) return false;
      }
      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // View handler
  const handleView = async (user: any) => {
    setViewUser(user);
    setViewLoading(true);
    const [ordersRes, ticketsRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*, products(name))').eq('user_id', user.user_id).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('user_id', user.user_id).order('created_at', { ascending: false }),
    ]);
    setViewOrders(ordersRes.data || []);
    setViewTickets(ticketsRes.data || []);
    setViewLoading(false);
  };

  // Edit handler
  const handleEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      emailConfirmed: false,
      is_suspended: user.is_suspended || false,
      role: user.roles?.[0] || 'customer',
    });
  };

  const updateUser = useMutation({
    mutationFn: async () => {
      const payload: any = {
        action: 'update',
        user_id: editUser.user_id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        is_suspended: editForm.is_suspended,
      };
      if (editForm.password) payload.password = editForm.password;
      if (editForm.emailConfirmed) payload.email_confirmed = true;
      if (isAdmin && editForm.role !== (editUser.roles?.[0] || 'customer')) {
        payload.role = editForm.role;
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-user', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (e: any) => toast.error(e.message),
  });


  const createUser = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'create', name: addForm.name, email: addForm.email, phone: addForm.phone, password: addForm.password, role: addForm.role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Customer created successfully');
      setAddOpen(false);
      setAddForm({ name: '', email: '', phone: '', password: '', role: 'customer' });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning',
    processing: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/20 text-destructive',
    refunded: 'bg-muted text-muted-foreground',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Customers</h2>
        <Button onClick={() => setAddOpen(o => !o)} variant={addOpen ? 'outline' : 'default'}>
          {addOpen ? <><X className="h-4 w-4 mr-2" /> Close</> : <><Plus className="h-4 w-4 mr-2" /> Add Customer</>}
        </Button>
      </div>

      {addOpen && (
        <div className="border border-border rounded-lg p-4 mb-4 bg-card">
          <h3 className="font-semibold text-foreground mb-3">Add Customer</h3>
          <p className="text-xs text-muted-foreground mb-4">Create a new user account. If password is blank, the email will be used as the password.</p>
          <form onSubmit={e => { e.preventDefault(); createUser.mutate(); }} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Password <span className="text-muted-foreground text-xs">(min 6 chars, optional)</span></Label>
              <Input type="text" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="Login password" />
            </div>
            <div>
              <Label>Role</Label>
              <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className={selectClassName}>
                <option value="customer">Customer</option>
                {isAdmin && <option value="editor">Editor</option>}
                {isAdmin && <option value="admin">Admin</option>}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending || !addForm.email}>
                {createUser.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by email, phone" className="pl-9" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClassName}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="customer">Customer</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClassName}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-12rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.email || '-'}
                    {u.is_suspended && <Badge variant="destructive" className="ml-2 text-[10px]">Suspended</Badge>}
                  </TableCell>
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
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleView(u)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(u)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
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

      {/* View Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewUser?.email || 'User'} — Activity</DialogTitle>
            <DialogDescription>Orders and tickets created by this user</DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <p className="text-muted-foreground py-4">Loading...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Orders ({viewOrders.length})</h4>
                {viewOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders found</p>
                ) : (
                  <div className="border border-border rounded-lg overflow-auto max-h-60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Products</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewOrders.map((o: any) => (
                          <TableRow key={o.id}>
                            <TableCell className="text-foreground">{o.order_number || o.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {o.order_items?.map((i: any) => i.products?.name).filter(Boolean).join(', ') || '-'}
                            </TableCell>
                            <TableCell className="text-foreground">Rs. {o.total}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs capitalize ${statusColors[o.status] || ''}`}>{o.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Tickets ({viewTickets.length})</h4>
                {viewTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets found</p>
                ) : (
                  <div className="border border-border rounded-lg overflow-auto max-h-60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket #</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewTickets.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-foreground">{t.ticket_number}</TableCell>
                            <TableCell className="text-foreground">{t.subject}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-xs capitalize ${t.status === 'open' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>{t.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(t.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer details</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); updateUser.mutate(); }} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="" />
            </div>
            <div>
              <Label>Password <span className="text-muted-foreground text-xs">(leave blank to keep current)</span></Label>
              <Input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="New password" className="" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="emailConfirmed" checked={editForm.emailConfirmed} onCheckedChange={(c) => setEditForm(f => ({ ...f, emailConfirmed: !!c }))} />
              <Label htmlFor="emailConfirmed" className="text-sm cursor-pointer">Make Account OTP Verified</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="suspended" checked={editForm.is_suspended} onCheckedChange={(c) => setEditForm(f => ({ ...f, is_suspended: !!c }))} />
              <Label htmlFor="suspended" className="text-sm cursor-pointer text-destructive">Suspend User</Label>
            </div>
            {editForm.is_suspended && (
              <p className="text-xs text-destructive">User will be unable to log in and will see: "Your account is suspended, please contact Support team."</p>
            )}

            {isAdmin && (
              <div>
                <Label>Role</Label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className={selectClassName}>
                  <option value="customer">Customer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Change this user's permission level.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updateUser.isPending}>{updateUser.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default AdminCustomers;

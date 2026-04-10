import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, icons } from 'lucide-react';

const AdminTopMenu = () => {
  const queryClient = useQueryClient();
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [editNavDialogOpen, setEditNavDialogOpen] = useState(false);
  const [newNavItem, setNewNavItem] = useState({ label: '', url: '', icon: '', sort_order: '0' });
  const [editNavItem, setEditNavItem] = useState<{ id: string; label: string; url: string; icon: string; sort_order: string }>({ id: '', label: '', url: '', icon: '', sort_order: '0' });
  const [iconSearch, setIconSearch] = useState('');

  const { data: navItems } = useQuery({
    queryKey: ['admin-nav-menu-items'],
    queryFn: async () => {
      const { data } = await supabase.from('nav_menu_items').select('*').order('sort_order');
      return data || [];
    },
  });

  const addNavItem = useMutation({
    mutationFn: async () => {
      await supabase.from('nav_menu_items').insert({
        label: newNavItem.label, url: newNavItem.url, icon: newNavItem.icon || null,
        sort_order: parseInt(newNavItem.sort_order) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
      setNavDialogOpen(false);
      setNewNavItem({ label: '', url: '', icon: '', sort_order: '0' });
      toast.success('Menu item added!');
    },
  });

  const deleteNavItem = useMutation({
    mutationFn: async (id: string) => { await supabase.from('nav_menu_items').delete().eq('id', id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
      toast.success('Menu item deleted!');
    },
  });

  const toggleNavItem = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('nav_menu_items').update({ is_active }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
    },
  });

  const updateNavItem = useMutation({
    mutationFn: async () => {
      await supabase.from('nav_menu_items').update({
        label: editNavItem.label, url: editNavItem.url, icon: editNavItem.icon || null,
        sort_order: parseInt(editNavItem.sort_order) || 0,
      }).eq('id', editNavItem.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
      setEditNavDialogOpen(false);
      toast.success('Menu item updated!');
    },
  });

  const iconNames = Object.keys(icons).filter(name => name !== 'createLucideIcon');
  const filteredIcons = iconSearch ? iconNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 30) : [];

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const LucideIcon = (icons as Record<string, any>)[iconName];
    if (!LucideIcon) return null;
    return <LucideIcon className="h-4 w-4" />;
  };

  const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div>
      <Label>Icon (Lucide icon name)</Label>
      <Input value={value} onChange={e => { onChange(e.target.value); setIconSearch(e.target.value); }} placeholder="e.g. Tv, Music, ShoppingBag" />
      {iconSearch && filteredIcons.length > 0 && (
        <div className="mt-1 max-h-32 overflow-y-auto border border-border rounded-md bg-background p-2 grid grid-cols-4 gap-1">
          {filteredIcons.map(name => {
            const Icon = (icons as Record<string, any>)[name];
            return (
              <button key={name} type="button"
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-xs hover:bg-secondary transition-colors ${value === name ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                onClick={() => { onChange(name); setIconSearch(''); }}>
                <Icon className="h-4 w-4" />
                <span className="truncate w-full text-center text-[10px]">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Top Menu</h2>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Navigation Menu</CardTitle>
            <Dialog open={navDialogOpen} onOpenChange={setNavDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Label</Label><Input value={newNavItem.label} onChange={e => setNewNavItem({...newNavItem, label: e.target.value})} placeholder="e.g. Streaming" /></div>
                  <div><Label>URL</Label><Input value={newNavItem.url} onChange={e => setNewNavItem({...newNavItem, url: e.target.value})} placeholder="e.g. /category/streaming" /></div>
                  <IconPicker value={newNavItem.icon} onChange={v => setNewNavItem({...newNavItem, icon: v})} />
                  <div><Label>Sort Order</Label><Input type="number" value={newNavItem.sort_order} onChange={e => setNewNavItem({...newNavItem, sort_order: e.target.value})} /></div>
                  <Button onClick={() => newNavItem.label && newNavItem.url && addNavItem.mutate()} className="w-full">Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead><TableHead>Label</TableHead><TableHead>URL</TableHead>
                <TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {navItems?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{renderIcon(item.icon)}</TableCell>
                  <TableCell className="text-foreground font-medium">{item.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.url}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sort_order}</TableCell>
                  <TableCell><Switch checked={item.is_active} onCheckedChange={(checked) => toggleNavItem.mutate({ id: item.id, is_active: checked })} /></TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditNavItem({ id: item.id, label: item.label, url: item.url, icon: item.icon || '', sort_order: String(item.sort_order) }); setEditNavDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNavItem.mutate(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!navItems?.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No menu items yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <Dialog open={editNavDialogOpen} onOpenChange={setEditNavDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Label</Label><Input value={editNavItem.label} onChange={e => setEditNavItem({...editNavItem, label: e.target.value})} /></div>
                <div><Label>URL</Label><Input value={editNavItem.url} onChange={e => setEditNavItem({...editNavItem, url: e.target.value})} /></div>
                <IconPicker value={editNavItem.icon} onChange={v => setEditNavItem({...editNavItem, icon: v})} />
                <div><Label>Sort Order</Label><Input type="number" value={editNavItem.sort_order} onChange={e => setEditNavItem({...editNavItem, sort_order: e.target.value})} /></div>
                <Button onClick={() => editNavItem.label && editNavItem.url && updateNavItem.mutate()} className="w-full">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTopMenu;

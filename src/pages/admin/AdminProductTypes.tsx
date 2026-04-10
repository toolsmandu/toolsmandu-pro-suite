import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminProductTypes = () => {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: types, isLoading } = useQuery({
    queryKey: ['product-types'],
    queryFn: async () => {
      const { data } = await supabase.from('product_types').select('*').order('name');
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('product_types').insert({ name: newName.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setNewName('');
      setAdding(false);
      toast.success('Product type added!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('product_types').update({ name: editName.trim() }).eq('id', editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setEditingId(null);
      setEditName('');
      toast.success('Product type updated!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      toast.success('Product type deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Product Types</h2>
        {!adding ? (
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-2" /> Add Type</Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. 1 Year Subscription"
              className="w-64"
              onKeyDown={e => e.key === 'Enter' && newName.trim() && addMutation.mutate()}
            />
            <Button onClick={() => addMutation.mutate()} disabled={!newName.trim()}>Save</Button>
            <Button variant="ghost" onClick={() => { setAdding(false); setNewName(''); }}>Cancel</Button>
          </div>
        )}
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types?.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No product types yet. Add one above.</TableCell></TableRow>
              )}
              {types?.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-foreground">
                    {editingId === t.id ? (
                      <div className="flex gap-2 items-center">
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm w-64" onKeyDown={e => e.key === 'Enter' && editName.trim() && updateMutation.mutate()} />
                        <Button size="sm" onClick={() => updateMutation.mutate()} disabled={!editName.trim()}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditName(''); }}>Cancel</Button>
                      </div>
                    ) : t.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(t.id); setEditName(t.name); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminProductTypes;

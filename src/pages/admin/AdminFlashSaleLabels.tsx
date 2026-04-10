import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminFlashSaleLabels = () => {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const { data: labels, isLoading } = useQuery({
    queryKey: ['flash-sale-labels'],
    queryFn: async () => {
      const { data } = await supabase.from('flash_sale_labels').select('*').order('sort_order');
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newLabel.trim()) throw new Error('Label is required');
      const { error } = await supabase.from('flash_sale_labels').insert({ label: newLabel.trim(), sort_order: (labels?.length || 0) });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-labels'] });
      setNewLabel('');
      toast.success('Label added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('flash_sale_labels').update({ label: editLabel.trim() }).eq('id', editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-labels'] });
      setEditingId(null);
      setEditLabel('');
      toast.success('Label updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flash_sale_labels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-labels'] });
      toast.success('Label deleted');
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Flash Sale Labels</h2>

      <div className="flex gap-2 mb-6 max-w-md">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="e.g. 🔥 Hot Deal, Limited Time"
          onKeyDown={(e) => e.key === 'Enter' && addMutation.mutate()}
        />
        <Button onClick={() => addMutation.mutate()} disabled={!newLabel.trim()}>
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden max-w-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-foreground">
                    {editingId === l.id ? (
                      <div className="flex gap-2 items-center">
                        <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8 text-sm w-64" onKeyDown={e => e.key === 'Enter' && editLabel.trim() && updateMutation.mutate()} />
                        <Button size="sm" onClick={() => updateMutation.mutate()} disabled={!editLabel.trim()}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditLabel(''); }}>Cancel</Button>
                      </div>
                    ) : l.label}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(l.id); setEditLabel(l.label); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(l.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {labels?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">No labels yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminFlashSaleLabels;
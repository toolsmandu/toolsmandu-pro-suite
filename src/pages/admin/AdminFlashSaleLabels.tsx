import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TagSectionProps = {
  title: string;
  tableName: 'flash_sale_labels' | 'single_product_tags';
  queryKey: string;
  placeholder: string;
};

const TagSection = ({ title, tableName, queryKey, placeholder }: TagSectionProps) => {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const { data: labels, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data } = await supabase.from(tableName).select('*').order('sort_order');
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newLabel.trim()) throw new Error('Label is required');
      const { error } = await supabase.from(tableName).insert({ label: newLabel.trim(), sort_order: (labels?.length || 0) });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setNewLabel('');
      toast.success('Tag added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(tableName).update({ label: editLabel.trim() }).eq('id', editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setEditingId(null);
      setEditLabel('');
      toast.success('Tag updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success('Tag deleted');
    },
  });

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>

      <div className="flex gap-2 mb-4">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && addMutation.mutate()}
        />
        <Button onClick={() => addMutation.mutate()} disabled={!newLabel.trim()}>
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels?.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-foreground">
                    {editingId === l.id ? (
                      <div className="flex gap-2 items-center">
                        <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && editLabel.trim() && updateMutation.mutate()} />
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
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">No tags yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

const AdminFlashSaleLabels = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Product Tags</h2>
      <div className="grid gap-8 md:grid-cols-2">
        <TagSection
          title="Homepage Product Tags"
          tableName="flash_sale_labels"
          queryKey="flash-sale-labels"
          placeholder="e.g. 🔥 Hot Deal, Limited Time"
        />
        <TagSection
          title="Single Product Tags"
          tableName="single_product_tags"
          queryKey="single-product-tags"
          placeholder="e.g. Featured, Bestseller"
        />
      </div>
    </div>
  );
};

export default AdminFlashSaleLabels;

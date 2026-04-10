import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Pencil, Eye, Trash2, ChevronsUpDown, Check, X, Save } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatDate';

const selectClassName =
  'flex h-10 w-full rounded-md border border-foreground bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

const AdminNotes = () => {
  const queryClient = useQueryClient();
  const [productFilter, setProductFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  // Right panel state
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | null>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [form, setForm] = useState({ product_id: '', description: '' });

  // Add mode (new note)
  const [isAdding, setIsAdding] = useState(false);

  // Delete dialog
  const [deleteNote, setDeleteNote] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: notes, isLoading } = useQuery({
    queryKey: ['admin-notes'],
    queryFn: async () => {
      const { data } = await supabase.from('notes').select('*, products(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filteredNotes = useMemo(() => {
    if (productFilter === 'all') return notes || [];
    return (notes || []).filter((n: any) => n.product_id === productFilter);
  }, [notes, productFilter]);

  const closePanel = () => {
    setPanelMode(null);
    setSelectedNote(null);
    setIsAdding(false);
    setForm({ product_id: '', description: '' });
  };

  const handleView = (note: any) => {
    setSelectedNote(note);
    setPanelMode('view');
    setIsAdding(false);
  };

  const handleEdit = (note: any) => {
    setSelectedNote(note);
    setForm({ product_id: note.product_id, description: note.description });
    setPanelMode('edit');
    setIsAdding(false);
  };

  const handleAdd = () => {
    setSelectedNote(null);
    setForm({ product_id: '', description: '' });
    setPanelMode('edit');
    setIsAdding(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { product_id: form.product_id, description: form.description };
      if (isAdding) {
        const { error } = await supabase.from('notes').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notes').update(payload).eq('id', selectedNote.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      closePanel();
      toast.success(isAdding ? 'Note added!' : 'Note updated!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      setDeleteNote(null);
      if (selectedNote?.id === deleteNote?.id) closePanel();
      toast.success('Note deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isPanelOpen = panelMode !== null;

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Notes List */}
      <div className={`${isPanelOpen ? 'hidden lg:block lg:flex-1' : 'flex-1'} min-w-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Notes</h2>
          <div className="flex gap-2">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-56 justify-between border-foreground">
                  {productFilter === 'all' ? 'All Products' : products?.find(p => p.id === productFilter)?.name || 'Select product'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <Input
                  placeholder="Search products..."
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="mb-2 border-foreground"
                />
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  <button
                    className={cn("w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center", productFilter === 'all' && 'font-medium')}
                    onClick={() => { setProductFilter('all'); setFilterOpen(false); setFilterSearch(''); }}
                  >
                    {productFilter === 'all' && <Check className="h-3 w-3 mr-2" />}
                    <span className={productFilter !== 'all' ? 'ml-5' : ''}>All Products</span>
                  </button>
                  {products?.filter(p => p.name.toLowerCase().includes(filterSearch.toLowerCase())).map(p => (
                    <button
                      key={p.id}
                      className={cn("w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center", productFilter === p.id && 'font-medium')}
                      onClick={() => { setProductFilter(p.id); setFilterOpen(false); setFilterSearch(''); }}
                    >
                      {productFilter === p.id && <Check className="h-3 w-3 mr-2" />}
                      <span className={productFilter !== p.id ? 'ml-5' : ''}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Add Note
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-10rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note: any) => (
                  <TableRow
                    key={note.id}
                    className={cn("cursor-pointer", selectedNote?.id === note.id && 'bg-muted')}
                    onClick={() => handleView(note)}
                  >
                    <TableCell className="font-medium text-foreground">{note.products?.name || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(note.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleView(note)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(note)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteNote(note)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No notes found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Right Panel */}
      {isPanelOpen && (
        <div className="flex-1 min-w-0 border border-border rounded-lg bg-background flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              {isAdding ? 'Add Note' : panelMode === 'view' ? (selectedNote?.products?.name || 'Note') : 'Edit Note'}
            </h3>
            <div className="flex gap-2">
              {panelMode === 'view' && selectedNote && (
                <Button size="sm" variant="outline" onClick={() => handleEdit(selectedNote)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={closePanel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Panel Content */}
          <ScrollArea className="flex-1 p-4">
            {panelMode === 'view' && selectedNote && (
              <div
                className="prose prose-sm prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: selectedNote.description || '<p class="text-muted-foreground">No description</p>' }}
              />
            )}

            {panelMode === 'edit' && (
              <div className="space-y-4">
                <div>
                  <Label>Product</Label>
                  <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} className={selectClassName}>
                    <option value="">Select a product</option>
                    {products?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Description</Label>
                  <RichTextEditor value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={closePanel}>Cancel</Button>
                  <Button onClick={() => form.product_id && saveMutation.mutate()} disabled={!form.product_id || saveMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteNote} onOpenChange={() => setDeleteNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note for <strong>{deleteNote?.products?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteNote.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotes;

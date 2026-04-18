import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

type FieldType = 'email' | 'text' | 'password' | 'number' | 'checkbox';

interface FormState {
  name: string;
  field_type: FieldType;
  label: string;
  placeholder: string;
  is_required: boolean;
  checkbox_mode: 'single' | 'multi';
  question: string;
  options: string[];
}

const emptyForm = (): FormState => ({
  name: '',
  field_type: 'text',
  label: '',
  placeholder: '',
  is_required: false,
  checkbox_mode: 'single',
  question: '',
  options: [''],
});

const AdminInputFields = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: fields, isLoading } = useQuery({
    queryKey: ['input-fields'],
    queryFn: async () => {
      const { data, error } = await supabase.from('input_fields').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (field: any) => {
    setForm({
      name: field.name,
      field_type: field.field_type,
      label: field.label,
      placeholder: field.placeholder || '',
      is_required: field.is_required,
      checkbox_mode: field.checkbox_mode || 'single',
      question: field.question || '',
      options: Array.isArray(field.options) && field.options.length > 0 ? field.options : [''],
    });
    setEditingId(field.id);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isCheckbox = form.field_type === 'checkbox';
      const payload: any = {
        name: form.name.trim(),
        field_type: form.field_type,
        label: form.label.trim(),
        placeholder: form.placeholder.trim() || null,
        is_required: form.is_required,
        checkbox_mode: isCheckbox ? form.checkbox_mode : null,
        question: isCheckbox ? form.question.trim() || null : null,
        options: isCheckbox ? form.options.map((o) => o.trim()).filter(Boolean) : [],
      };
      if (!payload.name || !payload.label) throw new Error('Name and Label are required');
      if (isCheckbox && payload.options.length === 0) throw new Error('Add at least one option');

      if (editingId) {
        const { error } = await supabase.from('input_fields').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('input_fields').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['input-fields'] });
      toast.success(editingId ? 'Input field updated' : 'Input field created');
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('input_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['input-fields'] });
      toast.success('Deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isCheckbox = form.field_type === 'checkbox';

  const filteredFields = (fields || []).filter((f: any) =>
    !searchTerm.trim() || (f.label || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h2 className="text-2xl font-bold text-foreground">Input Fields</h2>
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by label..."
                className="pl-8 pr-8 h-9 w-64"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchTerm(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button variant="outline" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search input fields">
              <Search className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Input Field
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((f: any) => (
                <TableRow key={f.id} className="cursor-pointer" onClick={() => openEdit(f)}>
                  <TableCell className="font-medium text-foreground">{f.name}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{f.field_type}</TableCell>
                  <TableCell className="text-muted-foreground">{f.label}</TableCell>
                  <TableCell className={f.is_required ? 'text-success' : 'text-muted-foreground'}>
                    {f.is_required ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {f.field_type === 'checkbox'
                      ? `${f.checkbox_mode === 'multi' ? 'Multi' : 'Single'} • ${(f.options || []).length} options`
                      : f.placeholder || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(f); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(f.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {searchTerm ? 'No fields match your search.' : 'No input fields yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Input Field' : 'Add Input Field'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label>Input Field Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Customer Email" />
            </div>

            <div>
              <Label>Field Type *</Label>
              <select
                value={form.field_type}
                onChange={(e) => setForm({ ...form, field_type: e.target.value as FieldType })}
                className={selectClassName}
              >
                <option value="email">Email</option>
                <option value="text">Text</option>
                <option value="password">Password</option>
                <option value="number">Number</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </div>

            {!isCheckbox && (
              <>
                <div>
                  <Label>Label *</Label>
                  <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Shown above the field" />
                </div>
                <div>
                  <Label>Placeholder</Label>
                  <Input value={form.placeholder} onChange={(e) => setForm({ ...form, placeholder: e.target.value })} />
                </div>
              </>
            )}

            {isCheckbox && (
              <>
                <div>
                  <Label>Internal Label *</Label>
                  <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Internal name" />
                </div>
                <div>
                  <Label>Selection Mode *</Label>
                  <select
                    value={form.checkbox_mode}
                    onChange={(e) => setForm({ ...form, checkbox_mode: e.target.value as 'single' | 'multi' })}
                    className={selectClassName}
                  >
                    <option value="single">Single Option (only one can be selected)</option>
                    <option value="multi">Multi Option (multiple can be selected)</option>
                  </select>
                </div>
                <div>
                  <Label>Question *</Label>
                  <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="e.g. Choose your platform" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Options *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, options: [...form.options, ''] })}>
                      <Plus className="h-3 w-3 mr-1" /> Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const next = [...form.options];
                            next[i] = e.target.value;
                            setForm({ ...form, options: next });
                          }}
                          placeholder={`Option ${i + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive shrink-0"
                          onClick={() => setForm({ ...form, options: form.options.filter((_, x) => x !== i) })}
                          disabled={form.options.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={form.is_required} onCheckedChange={(v) => setForm({ ...form, is_required: v })} />
              <Label>Required</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInputFields;

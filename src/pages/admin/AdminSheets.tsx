import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';
import { useAuth } from '@/contexts/AuthContext';

const AdminSheets = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const { data: sheets, isLoading } = useQuery({
    queryKey: ['sheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sheets')
        .select('id, name, updated_at, created_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async (n: string) => {
      const { data, error } = await supabase
        .from('sheets')
        .insert({ name: n, data: [], created_by: user?.id })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      toast.success('Sheet created');
      setOpen(false); setName('');
      qc.invalidateQueries({ queryKey: ['sheets'] });
      navigate(`/admin/sheets/${d.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const renameMut = useMutation({
    mutationFn: async ({ id, n }: { id: string; n: string }) => {
      const { error } = await supabase.from('sheets').update({ name: n }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Renamed');
      setRenameId(null);
      qc.invalidateQueries({ queryKey: ['sheets'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sheets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Sheet deleted');
      qc.invalidateQueries({ queryKey: ['sheets'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sheets</h1>
          <p className="text-sm text-muted-foreground">Spreadsheet documents with formulas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Sheet</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create new sheet</DialogTitle></DialogHeader>
            <Input placeholder="Sheet name" value={name} onChange={(e) => setName(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!name.trim() || createMut.isPending} onClick={() => createMut.mutate(name.trim())}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            )}
            {!isLoading && (sheets || []).length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No sheets yet.</TableCell></TableRow>
            )}
            {(sheets || []).map((s: any) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/admin/sheets/${s.id}`)}>
                <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(s.updated_at)}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Dialog open={renameId === s.id} onOpenChange={(o) => !o && setRenameId(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setRenameId(s.id); setRenameVal(s.name); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Rename sheet</DialogTitle></DialogHeader>
                      <Input value={renameVal} onChange={(e) => setRenameVal(e.target.value)} />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameId(null)}>Cancel</Button>
                        <Button onClick={() => renameMut.mutate({ id: s.id, n: renameVal.trim() })} disabled={!renameVal.trim()}>Save</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this sheet?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(s.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSheets;

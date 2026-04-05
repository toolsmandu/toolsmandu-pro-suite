import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const AdminHeroSlides = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ image_url: '', link_url: '', sort_order: '0' });

  const { data: slides } = useQuery({
    queryKey: ['admin-hero-slides'],
    queryFn: async () => {
      const { data } = await supabase.from('hero_slides').select('*').order('sort_order');
      return data || [];
    },
  });

  const addSlide = useMutation({
    mutationFn: async () => {
      await supabase.from('hero_slides').insert({ image_url: form.image_url, link_url: form.link_url || null, sort_order: parseInt(form.sort_order) || 0 });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] }); setDialogOpen(false); setForm({ image_url: '', link_url: '', sort_order: '0' }); toast.success('Slide added!'); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('hero_slides').update({ is_active }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] }),
  });

  const deleteSlide = useMutation({
    mutationFn: async (id: string) => { await supabase.from('hero_slides').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] }); toast.success('Deleted'); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Hero Slides</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Slide</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Hero Slide</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} /></div>
              <div><Label>Link URL</Label><Input value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} /></div>
              <Button onClick={() => form.image_url && addSlide.mutate()} className="w-full">Add Slide</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Preview</TableHead><TableHead>Link</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {slides?.map(s => (
              <TableRow key={s.id}>
                <TableCell><img src={s.image_url} alt="" className="h-12 w-20 object-cover rounded" /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.link_url || '-'}</TableCell>
                <TableCell>{s.sort_order}</TableCell>
                <TableCell><Switch checked={s.is_active ?? true} onCheckedChange={v => toggleActive.mutate({ id: s.id, is_active: v })} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSlide.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminHeroSlides;

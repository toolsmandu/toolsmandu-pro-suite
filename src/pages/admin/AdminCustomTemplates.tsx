import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

const AdminCustomTemplates = () => {
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['admin-custom-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-custom-templates'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const list = templates || [];
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter((p: any) => p.name?.toLowerCase().includes(t) || p.slug?.toLowerCase().includes(t));
  }, [templates, q]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custom Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable named layouts you can apply to any product.</p>
        </div>
        <Button asChild>
          <Link to="/admin/custom-templates/new"><Plus className="h-4 w-4 mr-1" /> New template</Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No templates yet. Create your first one.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.slug}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="default" className="capitalize">{(t.template_type || '').replace('_', ' ')}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/custom-templates/${t.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                    onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteMutation.mutate(t.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomTemplates;

import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Search, Trash2, Image as ImageIcon, LayoutGrid, Sparkles, CreditCard } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { SECTION_LABELS, SECTION_TYPES, SectionType } from '@/components/admin/TemplateSectionsEditor';

const SECTION_META: Record<SectionType, { icon: any; description: string }> = {
  hero: { icon: ImageIcon, description: 'Top banner with heading, subheading, image and CTAs.' },
  app_grid: { icon: LayoutGrid, description: 'Grid of apps or icons with names.' },
  features: { icon: Sparkles, description: 'Alternating feature highlights with images.' },
  plans: { icon: CreditCard, description: 'Pricing plans / tiers with features.' },
};

const AdminCustomTemplates = () => {
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ['admin-layout-sections'],
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
      toast.success('Section deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-layout-sections'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const list = sections || [];
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter((p: any) => p.name?.toLowerCase().includes(t) || p.slug?.toLowerCase().includes(t));
  }, [sections, q]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Layout Section</h1>
          <p className="text-sm text-muted-foreground">Reusable building blocks. Pick one or more for any product with custom layout enabled.</p>
        </div>
        <Button asChild>
          <Link to="/admin/layout-section/new"><Plus className="h-4 w-4 mr-1" /> New section</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {SECTION_TYPES.map((t) => {
          const Icon = SECTION_META[t].icon;
          return (
            <Link
              key={t}
              to={`/admin/layout-section/new?type=${t}`}
              className="group bg-card border border-border rounded-lg p-4 hover:border-primary hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-semibold text-sm text-foreground">{SECTION_LABELS[t]}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{SECTION_META[t].description}</p>
              <div className="text-xs text-primary mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="h-3 w-3" /> New {SECTION_LABELS[t].toLowerCase()}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sections..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No sections yet. Create your first one.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t: any) => {
              const typeLabel = SECTION_LABELS[t.template_type as SectionType] || t.template_type;
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.slug}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="default">{typeLabel}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/layout-section/${t.id}`}>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomTemplates;

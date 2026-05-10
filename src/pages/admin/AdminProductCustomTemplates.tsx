import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

const AdminProductCustomTemplates = () => {
  const [q, setQ] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products-custom-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, custom_template')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    const list = products || [];
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter((p: any) => p.name?.toLowerCase().includes(t) || p.slug?.toLowerCase().includes(t));
  }, [products, q]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custom Templates</h1>
          <p className="text-sm text-muted-foreground">Configure a custom layout per product (e.g. Adobe-style page).</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No products found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((p: any) => {
              const tpl = p.custom_template && p.custom_template !== 'default' ? p.custom_template : null;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tpl ? (
                      <Badge variant="default" className="capitalize">{tpl.replace('_', ' ')}</Badge>
                    ) : (
                      <Badge variant="outline">Default</Badge>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/products/${p.id}/template`}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit template
                      </Link>
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

export default AdminProductCustomTemplates;

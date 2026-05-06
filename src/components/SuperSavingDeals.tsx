import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const SuperSavingDeals = () => {
  const { data: products } = useQuery({
    queryKey: ['super-saving-deals'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, image_url, price, original_price, stock_status, product_variations(price, original_price, is_active, stock_status)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const computeDeal = (p: any) => {
    const activeVars = (p.product_variations || []).filter((v: any) => v.is_active && v.stock_status !== 'out_of_stock');
    let price: number;
    let original: number | null;
    if (activeVars.length) {
      price = Math.min(...activeVars.map((v: any) => Number(v.price)));
      const origs = activeVars.filter((v: any) => v.original_price).map((v: any) => Number(v.original_price));
      original = origs.length ? Math.max(...origs) : null;
    } else {
      price = Number(p.price);
      original = p.original_price ? Number(p.original_price) : null;
    }
    if (!original || original <= price) return null;
    const discount = Math.round(((original - price) / original) * 100);
    return { price, original, discount };
  };

  const deals = (products || [])
    .map((p: any) => ({ p, d: computeDeal(p) }))
    .filter((x) => x.d)
    .sort((a, b) => b.d!.discount - a.d!.discount)
    .slice(0, 6);

  if (!deals.length) return null;

  return (
    <section className="mb-12">
      <div className="mb-6">
        <Link to="/categories" className="inline-flex items-center gap-2 group">
          <h2 className="text-2xl font-bold text-foreground">Super Saving Deals</h2>
          <ChevronRight className="h-5 w-5 text-foreground group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="text-sm text-muted-foreground mt-1">
          Grab the biggest savings on premium digital subscriptions and software keys!
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map(({ p, d }) => (
          <div
            key={p.id}
            className="flex gap-4 p-4 rounded-2xl border border-border"
            style={{ backgroundColor: '#0a2e5c' }}
          >
            <Link to={`/item/${p.slug}`} className="shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-background/40 flex items-center justify-center">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">📦</span>
              )}
            </Link>
            <div className="flex-1 min-w-0 flex flex-col">
              <Link to={`/item/${p.slug}`}>
                <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">{p.name}</h3>
              </Link>
              <div className="mt-auto pt-2">
                <p className="text-[11px] text-muted-foreground">
                  FROM <span className="line-through">Rs {d!.original}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-lg">Rs {d!.price}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success text-success-foreground">
                    -{d!.discount}%
                  </span>
                </div>
                <Button asChild size="sm" variant="outline" className="mt-2 h-8 text-xs">
                  <Link to={`/item/${p.slug}`}>
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Buy now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SuperSavingDeals;

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, ChevronRight, Flame, Tag, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const SuperSavingDeals = () => {
  const { data: products } = useQuery({
    queryKey: ['super-saving-deals-v2'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, image_url, price, last_price, stock_status, product_variations(price, is_active, stock_status)')
        .eq('show_in_super_saving_deal', true)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const computeDeal = (p: any) => {
    const activeVars = (p.product_variations || []).filter((v: any) => v.is_active && v.stock_status !== 'out_of_stock');
    const price = activeVars.length
      ? Math.min(...activeVars.map((v: any) => Number(v.price)))
      : Number(p.price);
    const last = p.last_price ? Number(p.last_price) : null;
    if (!last || last <= price) return { price, last: null, discount: null };
    const discount = Math.round(((last - price) / last) * 100);
    return { price, last, discount };
  };

  if (!products?.length) return null;

  return (
    <section className="mb-12 relative">
      {/* Sale-themed wrapper with vibrant gradient + decorative shapes */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-warning/30 shadow-[0_10px_40px_-10px_hsl(var(--warning)/0.4)]"
           style={{
             background: 'linear-gradient(135deg, hsl(0 75% 35%) 0%, hsl(15 85% 45%) 35%, hsl(35 90% 50%) 100%)',
           }}>
        {/* Decorative blurred glows */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-yellow-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-pink-500/30 blur-3xl" />
        {/* Diagonal pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0 2px, transparent 2px 14px)',
          }}
        />

        {/* Header */}
        <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-2">
              <Flame className="h-3.5 w-3.5 text-yellow-200" />
              <span className="text-[11px] font-bold tracking-widest text-white uppercase">Limited Time</span>
            </div>
            <Link to="/categories" className="inline-flex items-center gap-2 group">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-md tracking-tight">
                Super Saving Deals
              </h2>
              <Sparkles className="h-6 w-6 text-yellow-200" />
              <ChevronRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-sm text-white/90 mt-1">
              Grab the biggest savings on premium digital subscriptions and software keys!
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p: any) => {
            const d = computeDeal(p);
            return (
              <div
                key={p.id}
                className="group relative flex gap-4 pr-4 py-0 rounded-2xl bg-card overflow-hidden border border-white/20 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Discount ribbon */}
                {d.discount != null && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-bold shadow-md">
                    <Tag className="h-3 w-3" />
                    {d.discount}% OFF
                  </div>
                )}

                <Link
                  to={`/item/${p.slug}`}
                  className="shrink-0 self-stretch w-28 bg-background/40 flex items-center justify-center overflow-hidden"
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </Link>
                <div className="flex-1 min-w-0 flex flex-col py-4">
                  <Link to={`/item/${p.slug}`}>
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">{p.name}</h3>
                  </Link>
                  <div className="flex-1 flex flex-col justify-center py-2">
                    {d.last != null && (
                      <p className="text-[11px] text-muted-foreground">
                        LAST PRICE <span className="line-through">Rs {d.last}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-lg">Rs {d.price}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success text-success-foreground">
                        Now
                      </span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="h-8 text-xs bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white border-0">
                    <Link to={`/item/${p.slug}`}>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Buy now
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SuperSavingDeals;

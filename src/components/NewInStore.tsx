import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const NewInStore = () => {
  const { data: products } = useQuery({
    queryKey: ['new-in-store-v2'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, image_url, new_in_store_offer_text, price, product_variations(price, is_active)')
        .eq('show_in_new_in_store', true)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  if (!products?.length) return null;

  const getStartingPrice = (p: any): number | null => {
    const variationPrices = (p.product_variations || [])
      .filter((v: any) => v.is_active && v.price != null)
      .map((v: any) => Number(v.price));
    if (variationPrices.length) return Math.min(...variationPrices);
    return p.price != null ? Number(p.price) : null;
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-foreground whitespace-nowrap">New in Store</h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-12 pt-10">
        {products.map((p: any) => {
          const startPrice = getStartingPrice(p);
          return (
            <Link
              key={p.id}
              to={`/item/${p.slug}`}
              className="group relative flex items-center gap-3 rounded-2xl pl-20 pr-4 py-3 border border-border hover:border-primary transition-colors min-h-[72px]"
              style={{ backgroundColor: '#0a2e5c' }}
            >
              <div className="absolute -top-8 left-4 w-[54px] h-[calc(100%+2rem)] flex items-end justify-center pointer-events-none">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain rounded-[12px] drop-shadow-lg"
                  />
                ) : (
                  <div className="text-2xl">📦</div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">{p.name}</h3>
                {startPrice != null && (
                  <p className="text-xs font-medium line-clamp-1" style={{ color: '#fbbf24' }}>
                    Starts at Rs {startPrice}/-
                  </p>
                )}
                {p.new_in_store_offer_text && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.new_in_store_offer_text}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default NewInStore;

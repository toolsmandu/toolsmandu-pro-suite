import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';

import { SearchX } from 'lucide-react';

const SearchPage = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';

  const { data: products, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, product_variations(*)').ilike('name', `%${q}%`).limit(20);
      return data || [];
    },
    enabled: q.length > 0,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Search Results</h1>
      <p className="text-muted-foreground mb-8 text-center">Showing results for "{q}"</p>
      {isLoading ? null : products && products.length > 0 ? (
        <div className="grid gap-4 justify-center" style={{ gridTemplateColumns: 'repeat(auto-fill, 165px)' }}>
          {products.map(p => (
            <div key={p.id} className="w-[165px]">
              <ProductCard {...p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <SearchX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-4">No products found for "{q}"</p>
          <Link to="/" className="text-primary hover:underline">Browse all products</Link>
        </div>
      )}
    </div>
  );
};

export default SearchPage;

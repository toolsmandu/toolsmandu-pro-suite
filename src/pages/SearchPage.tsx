import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
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
      <h1 className="text-3xl font-bold text-foreground mb-2">Search Results</h1>
      <p className="text-muted-foreground mb-8">Showing results for "{q}"</p>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(p => <ProductCard key={p.id} {...p} />)}
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

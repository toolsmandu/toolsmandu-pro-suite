import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';


const CategoryPage = () => {
  const { slug } = useParams();

  const { data: category } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').eq('slug', slug!).single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['category-products-page', category?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, product_variations(*)').eq('category_id', category!.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!category?.id,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8 text-center">{category?.name || 'Category'}</h1>
      {isLoading ? null : products && products.length > 0 ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 165px))' }}>
          {products.map(p => (
            <div key={p.id} className="w-[165px]">
              <ProductCard {...p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No products in this category yet.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;

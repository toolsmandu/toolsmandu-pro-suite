import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';

interface Props {
  productId: string;
  categoryId?: string | null;
}

const AdobeRelated = ({ productId, categoryId }: Props) => {
  const { data: related } = useQuery({
    queryKey: ['adobe-template-related', categoryId, productId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_variations(*)')
        .eq('category_id', categoryId!)
        .neq('id', productId)
        .limit(4);
      return data || [];
    },
  });

  if (!related?.length) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Looking for similar items? Check these:
        </h2>
        <div className="grid gap-5 justify-center" style={{ gridTemplateColumns: 'repeat(auto-fill, 200px)' }}>
          {related.map((p: any) => (
            <div key={p.id} className="w-[200px]">
              <ProductCard {...p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobeRelated;

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdobeHero from './AdobeHero';
import AdobeAppGrid from './AdobeAppGrid';
import AdobeFeatures from './AdobeFeatures';
import AdobePlans from './AdobePlans';
import AdobeFAQs from './AdobeFAQs';
import AdobeRelated from './AdobeRelated';

const AdobeTemplate = ({ productId }: { productId: string }) => {
  const { data: sections, isLoading } = useQuery({
    queryKey: ['product-custom-sections', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_custom_sections')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
  });

  const { data: product } = useQuery({
    queryKey: ['adobe-template-product', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_variations(*)')
        .eq('id', productId)
        .single();
      return data;
    },
  });

  if (isLoading) return null;

  const get = (type: string) =>
    (sections?.find((s: any) => s.section_type === type)?.data as any) || {};

  return (
    <div className="min-h-screen">
      <AdobeHero data={get('hero')} product={product} />
      <AdobeAppGrid data={get('app_grid')} />
      <AdobeFeatures data={get('features')} />
      <AdobePlans data={get('plans')} />
    </div>
  );
};

export default AdobeTemplate;

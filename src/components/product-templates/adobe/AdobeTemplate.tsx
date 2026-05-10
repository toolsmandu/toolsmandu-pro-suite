import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdobeHero from './AdobeHero';
import AdobeAppGrid from './AdobeAppGrid';
import AdobeFeatures from './AdobeFeatures';
import AdobePlans from './AdobePlans';

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

  if (isLoading) return null;

  const get = (type: string) =>
    (sections?.find((s: any) => s.section_type === type)?.data as any) || {};

  return (
    <div className="min-h-screen">
      <AdobeHero data={get('hero')} />
      <AdobeAppGrid data={get('app_grid')} />
      <AdobeFeatures data={get('features')} />
      <AdobePlans data={get('plans')} />
    </div>
  );
};

export default AdobeTemplate;

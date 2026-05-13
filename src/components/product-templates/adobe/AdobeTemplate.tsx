import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdobeHero from './AdobeHero';
import AdobeAppGrid from './AdobeAppGrid';
import AdobeFeatures from './AdobeFeatures';
import AdobePlans from './AdobePlans';
import AdobePricingTable from './AdobePricingTable';
import AdobeFeaturesFAQ from './AdobeFeaturesFAQ';
import AdobeFeaturesIcon6 from './AdobeFeaturesIcon6';
import AdobeFeaturesIcon5 from './AdobeFeaturesIcon5';

import AdobeComparisonTwo from './AdobeComparisonTwo';
import AdobeBigProductsCards from './AdobeBigProductsCards';
import AdobeFAQs from './AdobeFAQs';
import AdobeRelated from './AdobeRelated';

const AdobeTemplate = ({ productId }: { productId: string }) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['product-layout-items', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_layout_items')
        .select('id, sort_order, template_id, data, custom_templates(id, name, template_type, data, is_active)')
        .eq('product_id', productId)
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

  const renderSection = (idx: number, type: string, data: any) => {
    switch (type) {
      case 'hero':
        return <AdobeHero key={idx} data={data} product={product as any} />;
      case 'app_grid':
        return <AdobeAppGrid key={idx} data={data} />;
      case 'features':
        return <AdobeFeatures key={idx} data={data} />;
      case 'plans':
        return <AdobePlans key={idx} data={data} />;
      case 'pricing_table':
        return <AdobePricingTable key={idx} data={data} />;
      case 'features_faq':
        return <AdobeFeaturesFAQ key={idx} data={data} />;
      case 'features_icon_6':
        return <AdobeFeaturesIcon6 key={idx} data={data} />;
      case 'features_icon_5':
        return <AdobeFeaturesIcon5 key={idx} data={data} />;
      case 'big_products_cards':
        return <AdobeBigProductsCards key={idx} data={data} />;
      case 'comparison_two':
        return <AdobeComparisonTwo key={idx} data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {(items || [])
        .filter((it: any) => it.custom_templates?.is_active)
        .map((it: any, idx: number) => {
          const perProduct = it.data && Object.keys(it.data).length > 0 ? it.data : null;
          const sectionData = perProduct || it.custom_templates.data || {};
          return (
            <div key={idx} id={`section-${idx + 1}`} className="scroll-mt-20">
              {renderSection(idx, it.custom_templates.template_type, sectionData)}
            </div>
          );
        })}
      {product?.description && (
        <section className="py-8 md:py-12 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div
              className="prose prose-sm prose-invert max-w-none text-white [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full"
              style={{ color: 'white' }}
              dangerouslySetInnerHTML={{ __html: product.description.replace(/<a /g, '<a style="color:#16a249" ') }}
            />
          </div>
        </section>
      )}
      <AdobeFAQs productName={product?.name || ''} />
      <AdobeRelated productId={productId} categoryId={product?.category_id} />
    </div>
  );
};

export default AdobeTemplate;

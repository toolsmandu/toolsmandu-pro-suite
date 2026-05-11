import AdobeHero from '@/components/product-templates/adobe/AdobeHero';
import AdobeAppGrid from '@/components/product-templates/adobe/AdobeAppGrid';
import AdobeFeatures from '@/components/product-templates/adobe/AdobeFeatures';
import AdobePlans from '@/components/product-templates/adobe/AdobePlans';
import AdobePricingTable from '@/components/product-templates/adobe/AdobePricingTable';
import AdobeFeaturesFAQ from '@/components/product-templates/adobe/AdobeFeaturesFAQ';
import AdobeFeaturesIcon6 from '@/components/product-templates/adobe/AdobeFeaturesIcon6';
import AdobeFeaturesIcon5 from '@/components/product-templates/adobe/AdobeFeaturesIcon5';
import AdobeStyleCards from '@/components/product-templates/adobe/AdobeStyleCards';
import AdobeComparisonTwo from '@/components/product-templates/adobe/AdobeComparisonTwo';
import { SectionType } from './TemplateSectionsEditor';

interface Props {
  type: SectionType;
  data: any;
}

const SectionPreview = ({ type, data }: Props) => {
  let node: React.ReactNode = null;
  switch (type) {
    case 'hero':
      node = <AdobeHero data={data || {}} />;
      break;
    case 'app_grid':
      node = <AdobeAppGrid data={data || {}} />;
      break;
    case 'features':
      node = <AdobeFeatures data={data || {}} />;
      break;
    case 'plans':
      node = <AdobePlans data={data || {}} />;
      break;
    case 'pricing_table':
      node = <AdobePricingTable data={data || {}} />;
      break;
    case 'features_faq':
      node = <AdobeFeaturesFAQ data={data || {}} />;
      break;
    case 'features_icon_6':
      node = <AdobeFeaturesIcon6 data={data || {}} showItemNumber />;
      break;
    case 'features_icon_5':
      node = <AdobeFeaturesIcon5 data={data || {}} showItemNumber />;
      break;
    case 'adobe_style_cards':
      node = <AdobeStyleCards data={data || {}} />;
      break;
    case 'comparison_two':
      node = <AdobeComparisonTwo data={data || {}} />;
      break;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30">
        Live preview
      </div>
      <div className="overflow-x-auto">
        <div className="origin-top-left scale-[0.6] w-[166.67%]">
          {node}
        </div>
      </div>
    </div>
  );
};

export default SectionPreview;

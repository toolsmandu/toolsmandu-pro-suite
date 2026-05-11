import { Link, useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SECTION_TYPES, SECTION_LABELS, SectionType } from '@/components/admin/TemplateSectionsEditor';
import AdobeHero from '@/components/product-templates/adobe/AdobeHero';
import AdobeAppGrid from '@/components/product-templates/adobe/AdobeAppGrid';
import AdobeFeatures from '@/components/product-templates/adobe/AdobeFeatures';
import AdobePlans from '@/components/product-templates/adobe/AdobePlans';
import AdobePricingTable from '@/components/product-templates/adobe/AdobePricingTable';

const SAMPLE: Record<SectionType, any> = {
  hero: {
    eyebrow: 'New release',
    heading: 'Your all-in-one creative suite',
    subheading: '<p>Design, edit and publish faster with industry-leading tools trusted by millions.</p>',
    image_url: '/placeholder.svg',
    cta_label: 'Buy now',
    cta_link: '#',
    secondary_cta_label: 'Learn more',
    secondary_cta_link: '#',
  },
  app_grid: {
    heading: 'Everything included',
    apps: [
      { name: 'Photoshop', icon_url: '/placeholder.svg' },
      { name: 'Illustrator', icon_url: '/placeholder.svg' },
      { name: 'Premiere Pro', icon_url: '/placeholder.svg' },
      { name: 'After Effects', icon_url: '/placeholder.svg' },
      { name: 'Lightroom', icon_url: '/placeholder.svg' },
      { name: 'InDesign', icon_url: '/placeholder.svg' },
    ],
    footer_text: '<p>Plus 20+ more creative apps and services.</p>',
  },
  features: {
    items: [
      { heading: 'Powerful editing', description: 'Pro-grade tools for photos, videos and design.', image_url: '/placeholder.svg', image_side: 'right' },
      { heading: 'Cloud sync', description: 'Your files, everywhere — automatic backup and sharing.', image_url: '/placeholder.svg', image_side: 'left' },
      { heading: 'AI-powered', description: 'Smart features that speed up your everyday workflow.', image_url: '/placeholder.svg', image_side: 'right' },
    ],
  },
  plans: {
    heading: 'Choose your plan',
    plans: [
      { name: 'Individual', price: '$19.99', period: 'mo', features: ['1 user', 'All apps', '100GB cloud'], cta_label: 'Buy now', cta_link: '#' },
      { name: 'Business', badge: 'Most popular', price: '$33.99', period: 'mo', features: ['Up to 5 users', 'All apps', '1TB cloud', 'Priority support'], cta_label: 'Buy now', cta_link: '#', highlighted: true },
      { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited users', 'Custom integrations', 'Dedicated manager'], cta_label: 'Contact sales', cta_link: '#' },
    ],
  },
};

const AdminLayoutSectionPreview = () => {
  const { type } = useParams<{ type: SectionType }>();
  if (!type || !SECTION_TYPES.includes(type as SectionType)) {
    return <Navigate to="/admin/layout-section" replace />;
  }
  const t = type as SectionType;
  const data = SAMPLE[t];

  let node: React.ReactNode = null;
  if (t === 'hero') node = <AdobeHero data={data} />;
  else if (t === 'app_grid') node = <AdobeAppGrid data={data} />;
  else if (t === 'features') node = <AdobeFeatures data={data} />;
  else if (t === 'plans') node = <AdobePlans data={data} />;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/layout-section"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{SECTION_LABELS[t]}</h1>
          <p className="text-sm text-muted-foreground">Layout preview with sample content. Real content is added per product.</p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30">
          Live preview
        </div>
        <div className="overflow-x-auto">
          {node}
        </div>
      </div>
    </div>
  );
};

export default AdminLayoutSectionPreview;

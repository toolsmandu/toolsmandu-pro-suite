import { Link, useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SECTION_TYPES, SECTION_LABELS, SectionType } from '@/components/admin/TemplateSectionsEditor';
import AdobeHero from '@/components/product-templates/adobe/AdobeHero';
import AdobeAppGrid from '@/components/product-templates/adobe/AdobeAppGrid';
import AdobeFeatures from '@/components/product-templates/adobe/AdobeFeatures';
import AdobePlans from '@/components/product-templates/adobe/AdobePlans';
import AdobePricingTable from '@/components/product-templates/adobe/AdobePricingTable';
import AdobeFeaturesFAQ from '@/components/product-templates/adobe/AdobeFeaturesFAQ';
import AdobeFeaturesIcon6 from '@/components/product-templates/adobe/AdobeFeaturesIcon6';
import AdobeFeaturesIcon5 from '@/components/product-templates/adobe/AdobeFeaturesIcon5';

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
  pricing_table: {
    heading: 'Detailed Pricing and Features',
    plans: [
      { name: 'Business Starter', currency: 'रू.', price: '499', period: 'mo', cta_label: 'Select Plan', cta_link: '#', note: 'You pay Rs. 5988 today. Renews at different price on 11 May, 2027.' },
      { name: 'Business Standard', currency: 'रू.', price: '1899', period: 'mo', cta_label: 'Select Plan', cta_link: '#', note: 'You pay Rs. 22788.00 today. Renews at different price on 11 May, 2027.' },
      { name: 'Business Plus', currency: 'रू.', price: '3099', period: 'mo', cta_label: 'Select Plan', cta_link: '#', note: 'You pay Rs. 37188.00 today. Renews at different price on 11 May, 2027.' },
    ],
    groups: [
      {
        title: 'Features',
        rows: [
          { label: 'Cloud Storage', values: ['30 GB', '2 TB', '5 TB'] },
          { label: 'Google Mail', values: ['✓', '✓', '✓'] },
          { label: 'Google Calendar', values: ['✓', '✓', '✓'] },
          { label: 'Google Meet', values: ['100 Users', '150 Users', '250 Users'] },
          { label: 'Google Chat', values: ['✓', '✓', '✓'] },
          { label: 'Google Docs', values: ['✓', '✓', '✓'] },
          { label: 'Google Sheets', values: ['✓', '✓', '✓'] },
          { label: 'Google Slides', values: ['✓', '✓', '✓'] },
          { label: 'Google Forms', values: ['✓', '✓', '✓'] },
          { label: 'Google Sites', values: ['✓', '✓', '✓'] },
          { label: 'Google Keep', values: ['✓', '✓', '✓'] },
        ],
      },
      {
        title: 'Security & Management',
        rows: [
          { label: '2-Step Verification', values: ['✓', '✓', '✓'] },
          { label: 'Group-based policy controls', values: ['', '✓', '✓'] },
          { label: 'Vault — retain, archive & search data', values: ['', '', '✓'] },
        ],
      },
    ],
  },
  features_faq: {
    heading: 'Why You Should Use A VPN in Nepal?',
    description: 'Access the internet freely, securely, and without borders to stay connected to your favorite apps and sites. NordVPN protects your online activity from surveillance, data theft, and insecure networks, giving you true digital privacy and peace of mind in Nepal and beyond.',
    image_url: '/placeholder.svg',
    image_side: 'left',
    items: [
      {
        heading: 'Secures your internet activity',
        description: 'NordVPN encrypts every connection, whether you\u2019re in the office or working remotely. This protects sensitive data and ensures secure access to internal systems from anywhere.',
        image_url: '/placeholder.svg',
      },
      {
        heading: 'Unlocks global business tools and platforms',
        description: 'Connect to servers around the world to access region-restricted software, marketplaces and SaaS platforms your team relies on.',
        image_url: '/placeholder.svg',
      },
      {
        heading: 'Boosts your online privacy',
        description: 'Hide your IP, block trackers and stop ISPs from monitoring your browsing \u2014 true privacy by default.',
        image_url: '/placeholder.svg',
      },
    ],
  },
  features_icon_6: {
    heading: 'What\u2019s so Great about our Zoho Mail Service?',
    subheading: 'Explore these features with every Zoho Mail plan.',
    columns: 3,
    items: [
      { icon_url: '/placeholder.svg', heading: 'Team Collaboration Tools', description: 'Use Streams for email-based discussions.' },
      { icon_url: '/placeholder.svg', heading: 'Advanced Spam Protection', description: 'Manage emails, events, and tasks from one unified platform.' },
      { icon_url: '/placeholder.svg', heading: 'Custom Domain Email', description: 'Create professional business email addresses using your domain name.' },
      { icon_url: '/placeholder.svg', heading: 'Offline Access & Mobile Support', description: 'Stay connected with Zoho Mail\u2019s mobile apps and offline email access.' },
      { icon_url: '/placeholder.svg', heading: 'Calendar, Tasks & Notes', description: 'Manage emails, events, and tasks from one unified platform.' },
      { icon_url: '/placeholder.svg', heading: 'Ad-Free & Secure Email', description: 'Manage emails, events, and tasks from one unified platform.' },
    ],
  },
  features_icon_5: {
    heading: 'What\u2019s So Great About Our AWS Plans?',
    subheading: 'Enjoy the following features with every AWS plan.',
    items: [
      { icon_url: '/placeholder.svg', heading: 'World\u2019s Largest Cloud Community', description: 'Tap into a global network of customers, partners, and experts to accelerate your success.' },
      { icon_url: '/placeholder.svg', heading: 'Built-In Security You Can Rely On', description: 'Protect your data with industry-leading security, trusted by the world\u2019s most sensitive organizations.' },
      { icon_url: '/placeholder.svg', heading: 'Expertise You Can Count On', description: 'With unmatched operational expertise and a proven track record, we ensure your business runs smoothly, reliably, and at scale.' },
      { icon_url: '/placeholder.svg', heading: 'Drive Transformation & Innovation', description: 'Leverage cutting-edge solutions to accelerate your business growth and stay ahead of the competition.' },
      { icon_url: '/placeholder.svg', heading: 'Unmatched Cloud Capabilities', description: 'Access the widest range of services to build, scale, optimize your applications and turn your ideas into reality.' },
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
  else if (t === 'pricing_table') node = <AdobePricingTable data={data} />;
  else if (t === 'features_faq') node = <AdobeFeaturesFAQ data={data} />;
  else if (t === 'features_icon_6') node = <AdobeFeaturesIcon6 data={data} />;
  else if (t === 'features_icon_5') node = <AdobeFeaturesIcon5 data={data} />;

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

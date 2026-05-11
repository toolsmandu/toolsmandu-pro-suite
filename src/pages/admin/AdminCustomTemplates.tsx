import { Link } from 'react-router-dom';
import { Image as ImageIcon, LayoutGrid, Sparkles, CreditCard, Table as TableIcon, ListCollapse, Grid3x3, Grid2x2, Rocket, Columns2 } from 'lucide-react';
import { SECTION_LABELS, SECTION_TYPES, SectionType } from '@/components/admin/TemplateSectionsEditor';

const SECTION_META: Record<SectionType, { icon: any; description: string }> = {
  hero: { icon: ImageIcon, description: 'Top banner with heading, subheading, image and CTAs.' },
  app_grid: { icon: LayoutGrid, description: 'Grid of apps or icons with names.' },
  features: { icon: Sparkles, description: 'Alternating feature highlights with images.' },
  features_faq: { icon: ListCollapse, description: 'Accordion-style features with a synced preview image.' },
  features_icon_5: { icon: Grid2x2, description: 'Bento grid of 5 icon + heading + description feature cards.' },
  features_icon_6: { icon: Grid3x3, description: 'Grid of icon + heading + description feature cards.' },
  
  comparison_two: { icon: Columns2, description: 'Side-by-side comparison of two options with check/cross rows.' },
  plans: { icon: CreditCard, description: 'Pricing plans / tiers with features.' },
  pricing_table: { icon: TableIcon, description: 'Detailed pricing & feature comparison table.' },
};

const AdminCustomTemplates = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Layout Section</h1>
        <p className="text-sm text-muted-foreground">You can view all section types here.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SECTION_TYPES.map((t) => {
          const Icon = SECTION_META[t].icon;
          return (
            <Link
              key={t}
              to={`/admin/layout-section/preview/${t}`}
              className="group bg-card border border-border rounded-lg p-4 hover:border-primary hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-semibold text-sm text-foreground">{SECTION_LABELS[t]}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{SECTION_META[t].description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCustomTemplates;

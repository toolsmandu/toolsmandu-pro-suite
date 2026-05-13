import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Plan {
  name: string;
  price?: string;
  period?: string;
  badge?: string;
  features?: string[];
  cta_label?: string;
  cta_link?: string;
  variation_id?: string;
  highlighted?: boolean;
}

interface PlansData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  plans?: Plan[];
}

const AdobePlans = ({ data }: { data: PlansData }) => {
  if (!data.plans?.length) return null;

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {data.eyebrow && (
              <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">
                {data.eyebrow}
              </p>
            )}
            {data.heading && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {data.heading}
              </h2>
            )}
            {data.subheading && (
              <p className="text-lg md:text-xl text-foreground/70">{data.subheading}</p>
            )}
          </div>
        )}
        <div className={cn(
          'grid gap-6 mx-auto',
          data.plans.length === 2
            ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
            : 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl'
        )}>
          {data.plans.map((plan, idx) => (
            <div
              key={idx}
              className={cn(
                'relative rounded-2xl p-7 border bg-card flex flex-col',
                plan.highlighted ? 'border-primary shadow-2xl shadow-primary/20 scale-[1.02]' : 'border-border/60'
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-bold text-card-foreground mb-2">{plan.name}</h3>
              {plan.price && (
                <div className="mb-5">
                  <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
                  )}
                </div>
              )}
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-3 mb-7 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-card-foreground/85">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-white" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plan.cta_label && (
                plan.variation_id ? (
                  <Button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('adobe:select-variation', { detail: { variationId: plan.variation_id } }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn('w-full rounded-full', !plan.highlighted && 'bg-foreground text-background hover:bg-foreground/90')}
                  >
                    {plan.cta_label}
                  </Button>
                ) : (
                  <Button
                    asChild
                    className={cn('w-full rounded-full', !plan.highlighted && 'bg-foreground text-background hover:bg-foreground/90')}
                  >
                    <Link to={plan.cta_link || '#'}>{plan.cta_label}</Link>
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobePlans;

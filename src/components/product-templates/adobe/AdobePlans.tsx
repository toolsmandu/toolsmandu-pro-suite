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
  highlighted?: boolean;
}

interface PlansData {
  heading?: string;
  plans?: Plan[];
}

const AdobePlans = ({ data }: { data: PlansData }) => {
  if (!data.plans?.length) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {data.heading && (
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            {data.heading}
          </h2>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plan.cta_label && (
                <Button
                  asChild
                  className={cn('w-full rounded-full', !plan.highlighted && 'bg-foreground text-background hover:bg-foreground/90')}
                  variant={plan.highlighted ? 'default' : 'default'}
                >
                  <Link to={plan.cta_link || '#'}>{plan.cta_label}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobePlans;

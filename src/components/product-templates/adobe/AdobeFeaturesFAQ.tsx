import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  heading: string;
  description?: string;
}

interface FeaturesFAQData {
  heading?: string;
  description?: string;
  items?: FAQItem[];
}

const AdobeFeaturesFAQ = ({ data }: { data: FeaturesFAQData }) => {
  const items = data.items || [];
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const current = items[active] || items[0];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {(data.heading || data.description) && (
          <div className="max-w-3xl mx-auto text-center mb-12">
            {data.heading && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{data.heading}</h2>
            )}
            {data.description && (
              <div className="text-base md:text-lg text-foreground/75 leading-relaxed prose prose-invert max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: data.description }} />
            )}
          </div>
        )}

        <div className="max-w-3xl mx-auto divide-y divide-border">
          {items.map((it, i) => {
            const open = i === active;
            return (
              <div key={i} className="py-1">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className="w-full flex items-center justify-between gap-4 text-left py-4"
                  aria-expanded={open}
                >
                  <span className={cn(
                    'text-lg md:text-xl font-semibold transition-colors',
                    open ? 'text-foreground' : 'text-foreground/70'
                  )}>
                    {it.heading}
                  </span>
                  <ChevronDown className={cn(
                    'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                    open && 'rotate-180 text-foreground'
                  )} />
                </button>
                <div className={cn(
                  'grid transition-all duration-300',
                  open ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'
                )}>
                  <div className="overflow-hidden">
                    {it.description && (
                      <div className="text-sm md:text-base text-foreground/75 leading-relaxed prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: it.description }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdobeFeaturesFAQ;

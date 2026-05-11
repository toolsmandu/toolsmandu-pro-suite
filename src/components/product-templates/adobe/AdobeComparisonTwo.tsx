import { Check, X } from 'lucide-react';

interface ComparisonItem {
  text: string;
  included?: boolean;
}

interface ComparisonSide {
  logo_url?: string;
  label?: string;
  items?: ComparisonItem[];
}

interface ComparisonTwoData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  left?: ComparisonSide;
  right?: ComparisonSide;
  highlight_side?: 'left' | 'right';
}

const Col = ({ side, highlight }: { side: ComparisonSide; highlight?: boolean }) => (
  <div
    className={`rounded-2xl border p-6 md:p-8 ${
      highlight
        ? 'border-[#8aae88] shadow-xl text-white'
        : 'border-border/60 bg-card'
    }`}
    style={highlight ? { backgroundColor: '#8aae88', color: '#ffffff' } : undefined}
  >
    <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${highlight ? 'border-white/30' : 'border-border/60'}`}>
      {side.logo_url && (
        <img
          src={side.logo_url}
          alt={side.label || ''}
          loading="lazy"
          className="h-12 w-12 object-contain"
        />
      )}
      {side.label && (
        <div className={`text-xl md:text-2xl font-bold ${highlight ? 'text-white' : 'text-card-foreground'}`}>
          {side.label}
        </div>
      )}
    </div>
    <ul className="space-y-4">
      {(side.items || []).map((it, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              it.included
                ? (highlight ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary')
                : (highlight ? 'bg-white/10 text-white' : 'bg-destructive/15 text-destructive')
            }`}
            aria-hidden
          >
            {it.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </span>
          <span className={`text-sm md:text-base leading-relaxed ${highlight ? 'text-white' : 'text-card-foreground/85'}`}>
            {it.text}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const AdobeComparisonTwo = ({ data }: { data: ComparisonTwoData }) => {
  if (!data.left && !data.right && !data.heading) return null;
  const highlight = data.highlight_side || 'right';

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {data.eyebrow && (
              <div className="text-sm font-semibold uppercase tracking-wider text-white mb-2">
                {data.eyebrow}
              </div>
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

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          <Col side={data.left || {}} highlight={highlight === 'left'} />
          <Col side={data.right || {}} highlight={highlight === 'right'} />
        </div>
      </div>
    </section>
  );
};

export default AdobeComparisonTwo;

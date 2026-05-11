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

const Col = ({ side, highlight }: { side: ComparisonSide; highlight?: boolean }) => {
  const accent = highlight ? '#2563eb' : 'hsl(var(--foreground) / 0.85)';
  return (
    <div className="flex flex-col">
      {/* Image card with arch */}
      <div className="relative rounded-2xl bg-muted/60 aspect-[16/5] flex items-end justify-center overflow-hidden">
        <div className="relative w-2/5 aspect-[2/1] rounded-t-full bg-background flex items-center justify-center pt-4">
          {side.logo_url ? (
            <img
              src={side.logo_url}
              alt={side.label || ''}
              loading="lazy"
              className={`h-32 w-32 md:h-40 md:w-40 object-contain ${highlight ? '' : 'opacity-40 grayscale'}`}
            />
          ) : (
            <div className={`h-32 w-32 md:h-40 md:w-40 rounded-full ${highlight ? 'bg-primary/20' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      </div>

      {/* Label connector */}
      <div className="flex items-center gap-2 mt-6">
        <div className="flex-1 h-px" style={{ background: accent }} />
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        <div
          className={`rounded-full border px-5 py-2 text-sm md:text-base font-semibold whitespace-nowrap ${
            highlight ? 'text-primary' : 'text-muted-foreground'
          }`}
          style={{ borderColor: accent }}
        >
          {side.label || ''}
        </div>
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        <div className="flex-1 h-px" style={{ background: accent }} />
      </div>

      {/* Items */}
      {(side.items || []).length > 0 && (
        <ul className="space-y-4 mt-6">
          {(side.items || []).map((it, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  it.included
                    ? (highlight ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')
                    : 'bg-destructive/15 text-destructive'
                }`}
                aria-hidden
              >
                {it.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </span>
              <span className="text-sm md:text-base text-foreground/85 leading-relaxed">
                {it.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AdobeComparisonTwo = ({ data }: { data: ComparisonTwoData }) => {
  if (!data.left && !data.right && !data.heading) return null;
  const highlight: string = 'right';

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

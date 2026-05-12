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
  const accent = highlight ? '#ffffff' : '#9ca3af';
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 md:p-8 border transition-all ${
        highlight
          ? 'border-white/20 shadow-2xl shadow-primary/20 ring-1 ring-white/10'
          : 'border-border/60 bg-card/40'
      }`}
      style={
        highlight
          ? { background: 'linear-gradient(160deg, #0a2e5c 0%, #061a36 100%)' }
          : undefined
      }
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white text-[#0a2e5c] text-[11px] font-bold uppercase tracking-wider px-3 py-1 shadow">
          Recommended
        </div>
      )}

      {/* Label connector */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: accent }} />
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} aria-hidden />
        <div
          className={`rounded-full border px-5 py-2 text-sm md:text-base font-semibold whitespace-nowrap ${highlight ? 'text-white' : 'text-gray-400'}`}
          style={{ borderColor: accent }}
        >
          {side.label || ''}
        </div>
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} aria-hidden />
        <div className="flex-1 h-px" style={{ background: accent }} />
      </div>

      {/* Items */}
      {(side.items || []).length > 0 && (
        <ul className="space-y-4 mt-8">
          {(side.items || []).map((it, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  it.included
                    ? (highlight ? 'bg-white/15 text-white' : 'bg-primary/15 text-primary')
                    : 'bg-destructive/15 text-destructive'
                }`}
                aria-hidden
              >
                {it.included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </span>
              <span className={`text-sm md:text-base leading-relaxed ${highlight ? 'text-white' : 'text-foreground/85'}`}>
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
    <section className="py-8 md:py-12 bg-background">
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

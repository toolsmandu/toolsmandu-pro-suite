import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PricingTablePlan {
  name: string;
  price?: string;
  currency?: string;
  period?: string;
  note?: string;
  variation_id?: string;
}

interface PricingTableRow {
  label: string;
  /** Per-plan values, aligned with plans[] by index. Use "true"/"yes"/"✓" for a check mark. */
  values: string[];
}

interface PricingTableGroup {
  title: string;
  rows: PricingTableRow[];
}

interface PricingTableData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  plans?: PricingTablePlan[];
  groups?: PricingTableGroup[];
}

const isCheck = (v?: string) => {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === '✓' || s === 'true' || s === 'yes' || s === 'check' || s === '✔';
};

const renderCell = (v?: string) => {
  if (!v) return <span className="text-muted-foreground">—</span>;
  if (isCheck(v)) return <Check className="h-5 w-5 mx-auto text-foreground" strokeWidth={3} />;
  return <span>{v}</span>;
};

const AdobePricingTable = ({ data }: { data: PricingTableData }) => {
  const plans = data.plans || [];
  const groups = data.groups || [];
  const [start, setStart] = useState(0);
  const [mobileIdx, setMobileIdx] = useState(0);
  // On mobile we show 1 plan at a time, on desktop up to 3.
  const visibleCount = 3;
  const canPrev = start > 0;
  const canNext = start + visibleCount < plans.length;

  const handleSelect = (variationId?: string) => {
    if (!variationId) {
      toast.error('Plan not available, contact support team');
      return;
    }
    window.dispatchEvent(new CustomEvent('adobe:select-variation', { detail: { variationId } }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!plans.length) return null;

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {data.eyebrow && (
              <p className="text-sm font-semibold tracking-widest uppercase italic text-white mb-2">
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

        {/* Desktop / tablet table */}
        <div className="hidden md:block">
          <div className="grid gap-x-6" style={{ gridTemplateColumns: `minmax(180px, 1fr) repeat(${plans.length}, minmax(0, 1fr))` }}>
            {/* Header row: Plan label + plans */}
            <div className="pt-2">
              <div className="text-base font-medium text-foreground/80 mb-2">Plan</div>
              {plans.length > visibleCount && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setStart((s) => Math.max(0, s - 1))}
                    disabled={!canPrev}
                    className="h-10 w-10 rounded-md border border-border flex items-center justify-center disabled:opacity-40"
                    aria-label="Previous plans"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setStart((s) => Math.min(plans.length - visibleCount, s + 1))}
                    disabled={!canNext}
                    className="h-10 w-10 rounded-md border border-border flex items-center justify-center disabled:opacity-40"
                    aria-label="Next plans"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {plans.map((p, i) => (
              <div key={i} className="pt-2">
                <div className="text-base font-medium text-foreground/80 mb-2">{p.name}</div>
                <div className="mb-3">
                  {p.currency && <span className="text-base align-top mr-0.5 line-through opacity-70">{p.currency}</span>}
                  <span className="text-4xl font-bold text-foreground">{p.price}</span>
                  {p.period && <span className="text-base text-muted-foreground">/{p.period}</span>}
                </div>
                {p.note && <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{p.note}</p>}
                <Button
                  type="button"
                  onClick={() => handleSelect(p.variation_id)}
                  className="w-full rounded-md bg-foreground text-background hover:bg-foreground/90"
                >
                  Select Plan
                </Button>
              </div>
            ))}

            {/* Feature groups */}
            {groups.map((g, gi) => (
              <div key={gi} className="contents">
                <div className="col-span-full mt-8 mb-2 bg-muted/40 border-y border-border px-4 py-3">
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{g.title}</div>
                </div>
                {g.rows.map((row, ri) => (
                  <div key={ri} className={cn('contents')}>
                    <div className="py-3 px-1 border-b border-border/60 text-sm text-foreground">{row.label}</div>
                    {plans.map((_, pi) => (
                      <div key={pi} className="py-3 px-1 border-b border-border/60 text-sm text-foreground text-center">
                        {renderCell(row.values?.[pi])}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: single plan with arrow nav */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMobileIdx((i) => Math.max(0, i - 1))}
              disabled={mobileIdx === 0}
              className="h-10 w-10 rounded-md border border-border flex items-center justify-center disabled:opacity-40"
              aria-label="Previous plan"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm text-muted-foreground">
              {mobileIdx + 1} / {plans.length}
            </div>
            <button
              onClick={() => setMobileIdx((i) => Math.min(plans.length - 1, i + 1))}
              disabled={mobileIdx === plans.length - 1}
              className="h-10 w-10 rounded-md border border-border flex items-center justify-center disabled:opacity-40"
              aria-label="Next plan"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {(() => {
            const p = plans[mobileIdx];
            return (
              <div className="mb-6">
                <div className="text-base font-medium text-foreground/80 mb-2">{p.name}</div>
                <div className="mb-3">
                  {p.currency && <span className="text-base align-top mr-0.5 line-through opacity-70">{p.currency}</span>}
                  <span className="text-4xl font-bold text-foreground">{p.price}</span>
                  {p.period && <span className="text-base text-muted-foreground">/{p.period}</span>}
                </div>
                {p.note && <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{p.note}</p>}
                <Button
                  type="button"
                  onClick={() => handleSelect(p.variation_id)}
                  className="w-full rounded-md bg-foreground text-background hover:bg-foreground/90"
                >
                  Select Plan
                </Button>
              </div>
            );
          })()}
          {groups.map((g, gi) => (
            <div key={gi} className="mb-6">
              <div className="bg-muted/40 border-y border-border px-3 py-2 mb-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{g.title}</div>
              </div>
              {g.rows.map((row, ri) => (
                <div key={ri} className="flex items-center justify-between py-3 border-b border-border/60 text-sm">
                  <span className="text-foreground">{row.label}</span>
                  <span className="text-foreground">{renderCell(row.values?.[mobileIdx])}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobePricingTable;

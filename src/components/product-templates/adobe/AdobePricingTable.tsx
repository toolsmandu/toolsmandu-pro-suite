import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingTablePlan {
  name: string;
  price?: string;
  currency?: string;
  period?: string;
  note?: string;
  cta_label?: string;
  cta_link?: string;
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
  heading?: string;
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

  if (!plans.length) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {data.heading && (
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            {data.heading}
          </h2>
        )}

        {/* Desktop / tablet table */}
        <div className="hidden md:block">
          <div className="grid gap-x-6" style={{ gridTemplateColumns: `minmax(180px, 1fr) repeat(${plans.length}, minmax(0, 1fr))` }}>
            {/* Header row: Plan label + plans */}
            <div className="pt-2">
              <div className="text-base font-medium text-foreground/80 mb-3">Plan</div>
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
                {p.cta_label && (
                  <Button asChild className="w-full rounded-md bg-foreground text-background hover:bg-foreground/90">
                    <Link to={p.cta_link || '#'}>{p.cta_label}</Link>
                  </Button>
                )}
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
                {p.cta_label && (
                  <Button asChild className="w-full rounded-md bg-foreground text-background hover:bg-foreground/90">
                    <Link to={p.cta_link || '#'}>{p.cta_label}</Link>
                  </Button>
                )}
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

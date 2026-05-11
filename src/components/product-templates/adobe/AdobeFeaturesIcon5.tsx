interface IconFeatureItem {
  icon_url?: string;
  heading: string;
  description?: string;
}

interface FeaturesIcon5Data {
  heading?: string;
  subheading?: string;
  items?: IconFeatureItem[];
}

const AdobeFeaturesIcon5 = ({ data, showItemNumber = false }: { data: FeaturesIcon5Data; showItemNumber?: boolean }) => {
  const items = (data.items || []).slice(0, 5);
  if (!items.length) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {(data.heading || data.subheading) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
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

        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          {/* Left column: 2 cards */}
          <div className="flex flex-col gap-6">
            {items.slice(0, 2).map((it, i) => {
              const stacked = i === 0;
              const globalIdx = i;
              return (
                <div
                  key={globalIdx}
                  className={`rounded-2xl border border-border/60 bg-card p-6 md:p-8 hover:shadow-lg hover:border-primary/40 transition-all min-h-0 overflow-hidden ${
                    stacked ? 'flex flex-col gap-6 flex-[2]' : 'flex items-center gap-6 flex-1'
                  }`}
                >
                  {stacked && showItemNumber && (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold self-start">
                      {globalIdx + 1}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!stacked && showItemNumber && (
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {globalIdx + 1}
                        </span>
                      )}
                      <h3 className="text-lg md:text-xl font-semibold text-card-foreground">
                        {it.heading}
                      </h3>
                    </div>
                    {it.description && (
                      <p className="text-sm md:text-base text-card-foreground/70 leading-relaxed">
                        {it.description}
                      </p>
                    )}
                  </div>
                  {it.icon_url && (
                    <img
                      src={it.icon_url}
                      alt={it.heading}
                      loading="lazy"
                      className={
                        stacked
                          ? 'w-full flex-1 min-h-0 max-h-full object-contain rounded-xl'
                          : 'h-40 w-40 md:h-48 md:w-48 object-contain shrink-0'
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right column: 3 cards */}
          <div className="flex flex-col gap-6">
            {items.slice(2, 5).map((it, i) => {
              const globalIdx = i + 2;
              return (
                <div
                  key={globalIdx}
                  className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 hover:shadow-lg hover:border-primary/40 transition-all flex items-center gap-6 flex-1 min-h-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {globalIdx + 1}
                      </span>
                      <h3 className="text-lg md:text-xl font-semibold text-card-foreground">
                        {it.heading}
                      </h3>
                    </div>
                    {it.description && (
                      <p className="text-sm md:text-base text-card-foreground/70 leading-relaxed">
                        {it.description}
                      </p>
                    )}
                  </div>
                  {it.icon_url && (
                    <img
                      src={it.icon_url}
                      alt={it.heading}
                      loading="lazy"
                      className="h-40 w-40 md:h-48 md:w-48 object-contain shrink-0"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdobeFeaturesIcon5;

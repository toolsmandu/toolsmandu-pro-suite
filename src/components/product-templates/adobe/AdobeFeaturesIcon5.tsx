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

const AdobeFeaturesIcon5 = ({ data }: { data: FeaturesIcon5Data }) => {
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
              return (
                <div
                  key={i}
                  className={`rounded-2xl border border-border/60 bg-card p-6 md:p-8 hover:shadow-lg hover:border-primary/40 transition-all flex-1 min-h-0 ${
                    stacked ? 'flex flex-col gap-6' : 'flex items-center gap-6'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2">
                      {it.heading}
                    </h3>
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
                          ? 'w-full h-56 md:h-80 object-cover rounded-xl'
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
            {items.slice(2, 5).map((it, i) => (
              <div
                key={i + 2}
                className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 hover:shadow-lg hover:border-primary/40 transition-all flex items-center gap-6 flex-1 min-h-0"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2">
                    {it.heading}
                  </h3>
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdobeFeaturesIcon5;

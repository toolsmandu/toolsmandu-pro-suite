interface IconFeatureItem {
  icon_url?: string;
  heading: string;
  description?: string;
}

interface FeaturesIcon6Data {
  heading?: string;
  subheading?: string;
  items?: IconFeatureItem[];
  columns?: 2 | 3;
}

const AdobeFeaturesIcon6 = ({ data, showItemNumber = false }: { data: FeaturesIcon6Data; showItemNumber?: boolean }) => {
  const items = data.items || [];
  if (!items.length) return null;

  // Indices that render as "featured" cards with big centered image (per screenshot: 3rd and 4th items)
  const featuredIndices = new Set([0, 5]);

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

        <div className="md:columns-2 gap-6 [column-fill:_balance]">
          {items.map((it, i) => {
            const featured = featuredIndices.has(i);
            return (
              <div
                key={i}
                className={`mb-6 break-inside-avoid rounded-2xl border border-border/60 p-6 md:p-8 hover:shadow-lg hover:border-primary/40 transition-all ${
                  featured ? 'flex flex-col items-center text-center' : 'flex items-center gap-5'
                }`}
                style={{ backgroundColor: '#0a2e5c' }}
              >
                {featured ? (
                  <>
                    {showItemNumber && (
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                        {i + 1}
                      </span>
                    )}
                    {it.icon_url && (
                      <img
                        src={it.icon_url}
                        alt={it.heading}
                        loading="lazy"
                        className="h-56 md:h-72 w-auto object-contain mb-6"
                      />
                    )}
                    <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2">
                      {it.heading}
                    </h3>
                    {it.description && (
                      <p className="text-sm md:text-base text-card-foreground/70 leading-relaxed max-w-md">
                        {it.description}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {it.icon_url && (
                      <img
                        src={it.icon_url}
                        alt={it.heading}
                        loading="lazy"
                        className="h-16 w-16 md:h-20 md:w-20 object-contain shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {showItemNumber && (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {i + 1}
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdobeFeaturesIcon6;

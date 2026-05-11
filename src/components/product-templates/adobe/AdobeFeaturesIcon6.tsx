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

const AdobeFeaturesIcon6 = ({ data }: { data: FeaturesIcon6Data }) => {
  const items = data.items || [];
  if (!items.length) return null;
  const cols = data.columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

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

        <div className={`grid gap-6 ${cols}`}>
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-6 md:p-7 hover:shadow-lg hover:border-primary/40 transition-all"
            >
              {it.icon_url && (
                <div className="mb-4 h-14 w-14 flex items-center justify-center rounded-xl bg-primary/10">
                  <img
                    src={it.icon_url}
                    alt={it.heading}
                    loading="lazy"
                    className="h-9 w-9 object-contain"
                  />
                </div>
              )}
              <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2">
                {it.heading}
              </h3>
              {it.description && (
                <p className="text-sm md:text-base text-card-foreground/70 leading-relaxed">
                  {it.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobeFeaturesIcon6;

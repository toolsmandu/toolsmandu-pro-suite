interface AdobeStyleCard {
  icon_url?: string;
  heading: string;
  description?: string;
  cta_label?: string;
  cta_link?: string;
}

interface AdobeStyleCardsData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  items?: AdobeStyleCard[];
  columns?: 2 | 3 | 4;
}

const AdobeStyleCards = ({ data }: { data: AdobeStyleCardsData }) => {
  const items = data.items || [];
  if (!items.length && !data.heading) return null;
  const cols =
    data.columns === 2 ? 'md:grid-cols-2' :
    data.columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
    'md:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {data.eyebrow && (
              <div className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
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

        <div className={`grid gap-6 ${cols}`}>
          {items.map((it, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border/60 p-6 md:p-7 flex flex-col items-start hover:shadow-lg hover:border-primary/40 hover:-translate-y-1 transition-all"
              style={{ backgroundColor: '#0a2e5c' }}
            >
              {it.icon_url && (
                <div className="mb-4 h-16 w-16 flex items-center justify-center rounded-2xl bg-primary/5">
                  <img
                    src={it.icon_url}
                    alt={it.heading}
                    loading="lazy"
                    className="h-12 w-12 object-contain"
                  />
                </div>
              )}
              <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2">
                {it.heading}
              </h3>
              {it.description && (
                      <div className="text-sm md:text-base text-card-foreground/70 leading-relaxed mb-5 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: it.description }} />
                    )}
              {it.cta_label && (
                <a
                  href={it.cta_link || '#'}
                  className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {it.cta_label}
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobeStyleCards;

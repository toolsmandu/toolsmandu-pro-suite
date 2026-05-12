interface BigProductItem {
  image_url?: string;
  heading?: string;
  description?: string;
}

interface BigProductsCardsData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  columns?: number;
  items?: BigProductItem[];
}

const colsMap: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

const AdobeBigProductsCards = ({ data }: { data: BigProductsCardsData }) => {
  const items = data.items || [];
  if (!items.length) return null;
  const cols = colsMap[data.columns || 4] || 'lg:grid-cols-4';

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="max-w-3xl mx-auto text-center mb-12">
            {data.eyebrow && (
              <p className="text-sm md:text-base font-medium text-primary uppercase tracking-wide mb-2">{data.eyebrow}</p>
            )}
            {data.heading && (
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">{data.heading}</h2>
            )}
            {data.subheading && (
              <p className="text-base md:text-lg text-foreground/70">{data.subheading}</p>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-6`}>
          {items.map((it, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              {it.image_url && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img
                    src={it.image_url}
                    alt={it.heading || ''}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col flex-1 p-5">
                {it.heading && (
                  <h3 className="text-lg md:text-xl font-bold text-foreground leading-snug mb-2">
                    {it.heading}
                  </h3>
                )}
                {it.description && (
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {it.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobeBigProductsCards;

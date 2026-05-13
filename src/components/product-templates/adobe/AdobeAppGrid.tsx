interface App {
  name: string;
  icon_url?: string;
}

interface AppGridData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  apps?: App[];
  columns?: number;
}

const decodeHtmlEntities = (str: string): string => {
  if (typeof document === 'undefined') return str;
  let decoded = str;
  for (let i = 0; i < 2; i++) {
    const ta = document.createElement('textarea');
    ta.innerHTML = decoded;
    const next = ta.value;
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
};

const AdobeAppGrid = ({ data }: { data: AppGridData }) => {
  if (!data.apps?.length) return null;

  const colsMap: Record<number, string> = {
    2: 'md:grid-cols-2 lg:grid-cols-2',
    3: 'md:grid-cols-3 lg:grid-cols-3',
    4: 'md:grid-cols-3 lg:grid-cols-4',
    5: 'md:grid-cols-4 lg:grid-cols-5',
    6: 'md:grid-cols-4 lg:grid-cols-6',
    7: 'md:grid-cols-5 lg:grid-cols-7',
    8: 'md:grid-cols-5 lg:grid-cols-8',
  };
  const colClass = colsMap[data.columns || 5] || colsMap[5];

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        {(data.eyebrow || data.heading || data.subheading) && (
          <div className="max-w-3xl mx-auto text-center mb-10">
            {data.eyebrow && (
              <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">
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
        {!!data.apps?.length && (
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${colClass} gap-6`}>
            {data.apps.map((app, idx) => (
              <div
                key={idx}
                className="group flex flex-col items-center text-center p-5 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all"
              >
                {app.icon_url ? (
                  <img
                    src={app.icon_url}
                    alt={app.name}
                    loading="lazy"
                    className="w-16 h-16 rounded-lg object-cover mb-3 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted mb-3 flex items-center justify-center text-2xl">
                    {app.name?.[0] || '?'}
                  </div>
                )}
                <h3 className="font-semibold text-sm text-card-foreground mb-1">{app.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdobeAppGrid;

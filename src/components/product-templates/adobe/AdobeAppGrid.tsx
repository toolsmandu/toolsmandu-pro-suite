interface App {
  name: string;
  icon_url?: string;
  description?: string;
}

interface AppGridData {
  heading?: string;
  apps?: App[];
}

const AdobeAppGrid = ({ data }: { data: AppGridData }) => {
  if (!data.apps?.length) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {data.heading && (
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            {data.heading}
          </h2>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
              {app.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{app.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdobeAppGrid;

import { cn } from '@/lib/utils';

interface FeatureItem {
  heading: string;
  description?: string;
  image_url?: string;
  image_side?: 'left' | 'right';
}

interface FeaturesData {
  items?: FeatureItem[];
}

const AdobeFeatures = ({ data }: { data: FeaturesData }) => {
  if (!data.items?.length) return null;

  return (
    <section className="py-8 md:py-12 bg-secondary/30">
      <div className="container mx-auto px-4 space-y-10 md:space-y-14">
        {data.items.map((item, idx) => {
          const imageRight = (item.image_side || (idx % 2 === 0 ? 'right' : 'left')) === 'right';
          return (
            <div
              key={idx}
              className={cn(
                'grid md:grid-cols-2 gap-10 items-center',
                !imageRight && 'md:[&>:first-child]:order-2'
              )}
            >
              <div>
                <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-5 leading-tight">
                  {item.heading}
                </h3>
                {item.description && (
                  <div
                    className="text-base md:text-lg text-foreground/75 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                )}
              </div>
              {item.image_url && (
                <div>
                  <img
                    src={item.image_url}
                    alt={item.heading}
                    loading="lazy"
                    className="w-full h-auto rounded-2xl shadow-xl"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AdobeFeatures;

import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BulletItem {
  title?: string;
  description?: string;
}

interface ProductIntroItem {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  description?: string;
  image_url?: string;
  image_side?: 'left' | 'right';
  bullets?: BulletItem[];
  cta_label?: string;
  cta_link?: string;
}

interface ProductIntroData {
  items?: ProductIntroItem[];
}

const AdobeProductIntro = ({ data }: { data: ProductIntroData }) => {
  if (!data.items?.length) return null;

  return (
    <section className="py-8 md:py-14 bg-background">
      <div className="container mx-auto px-4 space-y-12 md:space-y-20">
        {data.items.map((item, idx) => {
          const imageRight = (item.image_side || (idx % 2 === 0 ? 'right' : 'left')) === 'right';
          const isExternal = item.cta_link?.startsWith('http');
          return (
            <div
              key={idx}
              className={cn(
                'grid md:grid-cols-2 gap-8 md:gap-12 items-center',
                !imageRight && 'md:[&>:first-child]:order-2'
              )}
            >
              <div>
                {item.eyebrow && (
                  <p className="text-sm md:text-base font-medium uppercase italic tracking-wide mb-3" style={{ color: '#ffffff' }}>
                    {item.eyebrow}
                  </p>
                )}
                {item.heading && (
                  <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                    {item.heading}
                  </h3>
                )}
                {item.subheading && (
                  <p className="text-base md:text-lg text-foreground/80 mb-4 leading-relaxed">
                    {item.subheading}
                  </p>
                )}
                {item.description && (
                  <div
                    className="text-base text-foreground/75 leading-relaxed mb-5 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                )}
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-3 mb-6 list-disc pl-5 marker:text-foreground/60">
                    {item.bullets.map((b, bi) => (
                      <li key={bi} className="text-sm md:text-base text-foreground/80 leading-relaxed">
                        {b.title && <span className="font-semibold text-foreground">{b.title} </span>}
                        {b.description}
                      </li>
                    ))}
                  </ul>
                )}
                {item.cta_label && item.cta_link && (
                  isExternal ? (
                    <a
                      href={item.cta_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-white hover:opacity-90 px-5 py-2.5 text-sm font-semibold transition-opacity"
                      style={{ backgroundColor: '#338fe1' }}
                    >
                      {item.cta_label}
                    </a>
                  ) : (
                    <Link
                      to={item.cta_link}
                      className="inline-flex items-center justify-center rounded-md text-white hover:opacity-90 px-5 py-2.5 text-sm font-semibold transition-opacity"
                      style={{ backgroundColor: '#338fe1' }}
                    >
                      {item.cta_label}
                    </Link>
                  )
                )}
              </div>
              {item.image_url && (
                <div>
                  <img
                    src={item.image_url}
                    alt={item.heading || ''}
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

export default AdobeProductIntro;

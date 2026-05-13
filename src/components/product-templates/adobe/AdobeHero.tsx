import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdobeVariationCard from './AdobeVariationCard';

interface HeroProduct {
  id: string;
  name: string;
  image_url?: string | null;
  duration?: string | null;
  price: number;
  stock_status?: string;
  product_variations?: any[];
}

interface HeroData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  cta_label?: string;
  cta_link?: string;
  secondary_cta_label?: string;
  secondary_cta_link?: string;
  bg_color?: string;
}

const decodeHtmlEntities = (value: string) => {
  let decoded = value;

  for (let i = 0; i < 2; i++) {
    if (!/&(?:amp;)?(?:lt|gt|quot|#39|nbsp|amp);/i.test(decoded)) break;

    const textarea = document.createElement('textarea');
    textarea.innerHTML = decoded;

    if (textarea.value === decoded) break;
    decoded = textarea.value;
  }

  return decoded;
};

const CtaLink = ({ href, children }: { href?: string; children: React.ReactNode }) => {
  const target = href || '#';
  if (target.startsWith('#')) {
    return (
      <a
        href={target}
        onClick={(e) => {
          const id = target.slice(1);
          const el = id ? document.getElementById(id) : null;
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      >
        {children}
      </a>
    );
  }
  return <Link to={target}>{children}</Link>;
};

const AdobeHero = ({ data, product }: { data: HeroData; product?: HeroProduct }) => {
  const subheadingHtml = data.subheading ? decodeHtmlEntities(data.subheading) : '';

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: data.bg_color || 'linear-gradient(135deg, hsl(224 76% 16%) 0%, hsl(222 47% 8%) 100%)' }}
    >
      <div className={`container mx-auto px-4 py-8 md:py-12 lg:py-16 gap-10 items-center relative z-10 ${product ? 'grid lg:grid-cols-[3fr_2fr]' : ''}`}>
        <div className="text-foreground">
          {data.eyebrow && (
            <p className="text-sm font-semibold tracking-widest uppercase text-white mb-4">
              {data.eyebrow}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
            {data.heading || 'Creative Cloud'}
          </h1>
          {subheadingHtml && (
            <div
              className="text-lg md:text-xl text-foreground/80 mb-8 leading-relaxed prose prose-invert prose-sm md:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: subheadingHtml }}
            />
          )}
          <div className="flex flex-wrap gap-3">
            {data.cta_label && (
              <Button asChild size="lg" className="rounded-full px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <CtaLink href={data.cta_link}>{data.cta_label}</CtaLink>
              </Button>
            )}
            {data.secondary_cta_label && (
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-foreground/40 text-foreground hover:bg-foreground/10">
                <CtaLink href={data.secondary_cta_link}>{data.secondary_cta_label}</CtaLink>
              </Button>
            )}
          </div>
        </div>
        {product && (
          <div className="relative flex justify-end">
            <div className="w-3/4">
              <AdobeVariationCard product={product as any} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdobeHero;

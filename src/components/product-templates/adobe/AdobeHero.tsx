import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HeroData {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  image_url?: string;
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

const AdobeHero = ({ data }: { data: HeroData }) => {
  const subheadingHtml = data.subheading ? decodeHtmlEntities(data.subheading) : '';

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: data.bg_color || 'linear-gradient(135deg, hsl(224 76% 16%) 0%, hsl(222 47% 8%) 100%)' }}
    >
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 grid lg:grid-cols-2 gap-10 items-center relative z-10">
        <div className="text-foreground">
          {data.eyebrow && (
            <p className="text-sm font-semibold tracking-widest uppercase text-primary-foreground/80 mb-4">
              {data.eyebrow}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
            {data.heading || 'Creative Cloud'}
          </h1>
          {subheadingHtml && (
            <div
              className="text-lg md:text-xl text-foreground/80 mb-8 max-w-xl leading-relaxed prose prose-invert prose-sm md:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: subheadingHtml }}
            />
          )}
          <div className="flex flex-wrap gap-3">
            {data.cta_label && (
              <Button asChild size="lg" className="rounded-full px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Link to={data.cta_link || '#'}>{data.cta_label}</Link>
              </Button>
            )}
            {data.secondary_cta_label && (
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-foreground/40 text-foreground hover:bg-foreground/10">
                <Link to={data.secondary_cta_link || '#'}>{data.secondary_cta_label}</Link>
              </Button>
            )}
          </div>
        </div>
        <div className="relative">
          {data.image_url ? (
            <img
              src={data.image_url}
              alt={data.heading || 'hero'}
              loading="eager"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default AdobeHero;

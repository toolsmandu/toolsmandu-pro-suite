import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';

const DEFAULT_ABOUT = `<p>Your <strong>Reliable partner</strong> for digital products and services — EASY, FAST &amp; SECURED!</p>
<p>Toolsmandu is an online platform which provides Genuine Digital Subscriptions At Best Price. We are providing Digital Services since 2021 and officially registered with Government of Nepal.</p>
<p>In a world full of online risks, Toolsmandu is your trusted partner for absolute security and convenience with service warranty on sold products.</p>
<p>As Toolsmandu, we keep growing by adding new products and services in our platform. By providing trustworthy service and years of experience in the industry, we have grown into one of the most reliable digital subscription platform in Nepal.</p>`;

const ReviewBadge = ({
  label,
  score,
  count,
  link,
  color,
}: { label: string; score: string; count: string; link: string; color: string }) => {
  const s = parseFloat(score) || 0;
  return (
    <a
      href={link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card/60 border border-border hover:border-primary/50 transition-colors"
    >
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5"
                style={{
                  color,
                  fill: i <= Math.round(s) ? color : 'transparent',
                }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {score} · {count} reviews
          </span>
        </div>
      </div>
    </a>
  );
};

const HomepageSeoContent = () => {
  const { data: settings } = useQuery({
    queryKey: ['homepage-seo-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key,value')
        .in('key', [
          'homepage_about_content',
          'homepage_seo_content',
          'footer_trustpilot_link',
          'footer_google_link',
          'trustpilot_score',
          'trustpilot_count',
          'google_score',
          'google_count',
        ]);
      return data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>) || {};
    },
  });

  const about = settings?.homepage_about_content || DEFAULT_ABOUT;
  const seo = settings?.homepage_seo_content || '';

  return (
    <section className="mb-12 mt-4">
      <div className="bg-card/40 rounded-lg p-6 md:p-8 border border-border/50">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          What is Toolsmandu? Why Toolsmandu?
        </h2>
        <div
          className="prose prose-invert max-w-none text-foreground/90 prose-p:my-3 prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: about }}
        />
        <div className="flex flex-wrap gap-3 mt-6">
          <ReviewBadge
            label="Trustpilot"
            score={settings?.trustpilot_score || '4.8'}
            count={settings?.trustpilot_count || '53'}
            link={settings?.footer_trustpilot_link || 'https://www.trustpilot.com/review/toolsmandu.com'}
            color="#00b67a"
          />
          <ReviewBadge
            label="Google Reviews"
            score={settings?.google_score || '4.9'}
            count={settings?.google_count || '120'}
            link={settings?.footer_google_link || '#'}
            color="#fbbc04"
          />
        </div>
      </div>

      {seo && (
        <div
          className="prose prose-invert max-w-none text-foreground/90 mt-8 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: seo }}
        />
      )}
    </section>
  );
};

export default HomepageSeoContent;

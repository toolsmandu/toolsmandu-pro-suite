import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_ABOUT = `<p>Your <strong>Reliable partner</strong> for digital products and services — EASY, FAST &amp; SECURED!</p>
<p>Toolsmandu is an online platform which provides Genuine Digital Subscriptions At Best Price. We are providing Digital Services since 2021 and officially registered with Government of Nepal.</p>
<p>In a world full of online risks, Toolsmandu is your trusted partner for absolute security and convenience with service warranty on sold products.</p>
<p>As Toolsmandu, we keep growing by adding new products and services in our platform. By providing trustworthy service and years of experience in the industry, we have grown into one of the most reliable digital subscription platform in Nepal.</p>`;

// Trustpilot-style star: filled green square with white star cutout
const TrustpilotStars = ({ score }: { score: number }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-[3px]">
      {stars.map((i) => {
        const fillPct = Math.max(0, Math.min(1, score - (i - 1))) * 100;
        return (
          <div key={i} className="relative h-6 w-6 bg-[#dcdce6]">
            <div
              className="absolute inset-0 bg-[#00b67a]"
              style={{ width: `${fillPct}%` }}
            />
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-6 w-6" aria-hidden>
              <path
                d="M12 17.3 6.2 21l1.5-6.6L2.5 9.9l6.7-.6L12 3l2.8 6.3 6.7.6-5.2 4.5L17.8 21z"
                fill="#fff"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// Google "G" logo
const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// Generic gold star (Google)
const GoldStars = ({ score }: { score: number }) => (
  <div className="flex gap-[1px]">
    {[1, 2, 3, 4, 5].map((i) => {
      const fillPct = Math.max(0, Math.min(1, score - (i - 1))) * 100;
      return (
        <div key={i} className="relative h-4 w-4">
          <svg viewBox="0 0 24 24" className="absolute inset-0 h-4 w-4 text-[#e0e0e0]" fill="currentColor" aria-hidden>
            <path d="M12 17.3 6.2 21l1.5-6.6L2.5 9.9l6.7-.6L12 3l2.8 6.3 6.7.6-5.2 4.5L17.8 21z"/>
          </svg>
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#fbbc04]" fill="currentColor" aria-hidden>
              <path d="M12 17.3 6.2 21l1.5-6.6L2.5 9.9l6.7-.6L12 3l2.8 6.3 6.7.6-5.2 4.5L17.8 21z"/>
            </svg>
          </div>
        </div>
      );
    })}
  </div>
);

const TrustpilotCard = ({ score, count, link }: { score: string; count: string; link: string }) => {
  const s = parseFloat(score) || 0;
  return (
    <a
      href={link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 px-4 py-3 rounded-lg bg-white text-[#191919] border border-[#dcdce6] hover:shadow-md transition-shadow min-w-[200px]"
    >
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path d="M12 .5 14.7 8.5 23 8.5l-6.7 4.9 2.6 8.1L12 16.6 5.1 21.5l2.6-8.1L1 8.5l8.3 0z" fill="#00b67a"/>
        </svg>
        <span className="text-[12px] font-bold text-[#191919]">Trustpilot</span>
      </div>
      <TrustpilotStars score={s} />
      <div className="flex items-center gap-1.5 text-[12px] text-[#191919]">
        <span>Based on <strong>{count}</strong> reviews</span>
      </div>
    </a>
  );
};

const GoogleCard = ({ score, count, link }: { score: string; count: string; link: string }) => {
  const s = parseFloat(score) || 0;
  return (
    <a
      href={link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 px-4 py-3 rounded-lg bg-white text-[#191919] border border-[#dcdce6] hover:shadow-md transition-shadow min-w-[200px]"
    >
      <div className="flex items-center gap-1.5">
        <GoogleG />
        <span className="text-[13px] font-medium text-[#5f6368]">Google Reviews</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-[#191919] leading-none">{score}</span>
        <GoldStars score={s} />
      </div>
      <div className="text-[12px] text-[#5f6368]">
        Based on <strong className="text-[#191919]">{count}</strong> reviews
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
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            What is Toolsmandu? Why Toolsmandu?
          </h2>
          <div className="flex flex-wrap gap-3 md:flex-nowrap md:shrink-0">
            <TrustpilotCard
              score={settings?.trustpilot_score || '4.8'}
              count={settings?.trustpilot_count || '53'}
              link={settings?.footer_trustpilot_link || 'https://www.trustpilot.com/review/toolsmandu.com'}
            />
            <GoogleCard
              score={settings?.google_score || '4.9'}
              count={settings?.google_count || '120'}
              link={settings?.footer_google_link || '#'}
            />
          </div>
        </div>
        <div
          className="prose prose-invert max-w-none text-foreground/90 prose-p:my-3 prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: about }}
        />
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

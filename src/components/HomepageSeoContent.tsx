import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_ABOUT = `<p>Your <strong>Reliable partner</strong> for digital products and services — EASY, FAST &amp; SECURED!</p>
<p>Toolsmandu is an online platform which provides Genuine Digital Subscriptions At Best Price. We are providing Digital Services since 2021 and officially registered with Government of Nepal.</p>
<p>In a world full of online risks, Toolsmandu is your trusted partner for absolute security and convenience with service warranty on sold products.</p>
<p>As Toolsmandu, we keep growing by adding new products and services in our platform. By providing trustworthy service and years of experience in the industry, we have grown into one of the most reliable digital subscription platform in Nepal.</p>`;


const HomepageSeoContent = () => {
  const { data: settings } = useQuery({
    queryKey: ['homepage-seo-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key,value')
        .in('key', [
          'homepage_seo_title',
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

  const title = settings?.homepage_seo_title || 'What is Toolsmandu? Why Toolsmandu?';
  const about = settings?.homepage_about_content || DEFAULT_ABOUT;
  const seo = settings?.homepage_seo_content || '';

  return (
    <section className="mb-12 mt-4">
      <div className="bg-card/40 rounded-lg p-6 md:p-8 border border-border/50">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          {title}
        </h2>
        {seo && (
          <div
            className="prose prose-invert max-w-none text-foreground/90 mb-6 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: seo }}
          />
        )}
        <div
          className="prose prose-invert max-w-none text-foreground/90 prose-p:my-3 prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: about }}
        />
      </div>
    </section>
  );
};

export default HomepageSeoContent;

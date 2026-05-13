import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as Icons from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { TrustpilotCard, GoogleCard } from './ReviewCards';

export type WhyItem = {
  icon: string;
  title: string;
  description: string;
};

const DEFAULT_TITLE = 'WHY CHOOSE TOOLSMANDU';
const DEFAULT_INTRO =
  'Toolsmandu is the trusted destination for genuine digital subscriptions in Nepal. We deliver authentic software, streaming, design, and productivity tools at the best prices — backed by warranty, fast support, and years of proven experience.';

const DEFAULT_ITEMS: WhyItem[] = [
  { icon: 'ShieldCheck', title: '100% Genuine Products', description: 'Only authentic, official subscriptions sourced directly — never cracked or shared illegally.' },
  { icon: 'Zap', title: 'Instant Delivery', description: 'Most products are delivered to your inbox within minutes of payment confirmation.' },
  { icon: 'BadgeCheck', title: 'Service Warranty', description: 'Every order is covered by a full warranty for the duration of your subscription.' },
  { icon: 'Wallet', title: 'Local Payment Methods', description: 'Pay easily with eSewa, Khalti, IME Pay, FonePay, or bank transfer in NPR.' },
  { icon: 'Headphones', title: 'Friendly 24/7 Support', description: 'Our Nepal-based support team is always one WhatsApp message away.' },
  { icon: 'TrendingDown', title: 'Best Prices in Nepal', description: 'Save big with shared family plans and bulk pricing you won\'t find elsewhere.' },
];

const getIcon = (name: string) => {
  const I = (Icons as any)[name];
  return I || ShieldCheck;
};

const HomepageWhyChooseUs = () => {
  const { data } = useQuery({
    queryKey: ['homepage-why-choose-us'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key,value')
        .in('key', [
          'homepage_why_title', 'homepage_why_intro', 'homepage_why_items', 'homepage_why_eyebrow',
          'trustpilot_score', 'trustpilot_count', 'google_score', 'google_count',
          'footer_trustpilot_link', 'footer_google_link',
        ]);
      return data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>) || {};
    },
  });

  const title = data?.homepage_why_title || DEFAULT_TITLE;
  const intro = data?.homepage_why_intro || DEFAULT_INTRO;
  const eyebrow = data?.homepage_why_eyebrow || 'Trusted by thousands';
  let items: WhyItem[] = DEFAULT_ITEMS;
  if (data?.homepage_why_items) {
    try {
      const parsed = JSON.parse(data.homepage_why_items);
      if (Array.isArray(parsed) && parsed.length) items = parsed;
    } catch {}
  }

  return (
    <section className="mb-12 mt-4">
      <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card/95 to-card/80 shadow-[0_20px_60px_-20px_rgba(59,130,246,0.35)]">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative p-6 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffffff] animate-pulse" />
              <span className="text-xs font-semibold tracking-[0.25em] text-[#ffffff] uppercase">{eyebrow}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#ffffff] uppercase">
              {title}
            </h2>
            <div className="mt-3 mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>

          {/* Intro + reviews */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-start mb-12">
            <p className="text-foreground/80 leading-relaxed text-base md:text-lg">
              {intro}
            </p>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-[260px]">
              <TrustpilotCard
                score={data?.trustpilot_score || '4.8'}
                count={data?.trustpilot_count || '53'}
                link={data?.footer_trustpilot_link || 'https://www.trustpilot.com/review/toolsmandu.com'}
              />
              <GoogleCard
                score={data?.google_score || '4.9'}
                count={data?.google_count || '120'}
                link={data?.footer_google_link || '#'}
              />
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-primary/40 via-border to-border hover:from-primary hover:via-primary/60 hover:to-primary/30 transition-all duration-300"
                >
                  <div className="relative h-full rounded-2xl bg-card/90 backdrop-blur p-6 overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                    {/* hover glow */}
                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Icon */}
                    <div className="relative mb-5 inline-flex">
                      <div className="absolute inset-0 rounded-2xl bg-primary/40 blur-lg opacity-50 group-hover:opacity-90 transition-opacity" />
                      <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg ring-1 ring-primary/50 group-hover:rotate-6 group-hover:scale-105 transition-transform duration-300">
                        <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.2} />
                      </div>
                    </div>

                    <h3 className="relative font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="relative text-sm text-foreground/70 leading-relaxed">
                      {item.description}
                    </p>

                    {/* corner number */}
                    <div className="absolute top-4 right-4 text-3xl font-black text-primary/10 group-hover:text-primary/30 transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomepageWhyChooseUs;

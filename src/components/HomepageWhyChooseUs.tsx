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
        .in('key', ['homepage_why_title', 'homepage_why_intro', 'homepage_why_items']);
      return data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>) || {};
    },
  });

  const title = data?.homepage_why_title || DEFAULT_TITLE;
  const intro = data?.homepage_why_intro || DEFAULT_INTRO;
  let items: WhyItem[] = DEFAULT_ITEMS;
  if (data?.homepage_why_items) {
    try {
      const parsed = JSON.parse(data.homepage_why_items);
      if (Array.isArray(parsed) && parsed.length) items = parsed;
    } catch {}
  }

  return (
    <section className="mb-12 mt-4">
      <div className="relative rounded-2xl border border-border/60 bg-card/40 overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-r from-primary/90 via-primary to-primary/90 py-5 px-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
          <h2 className="relative text-xl md:text-2xl font-extrabold tracking-[0.15em] text-primary-foreground uppercase">
            {title}
          </h2>
        </div>

        <div className="p-6 md:p-10">
          <p className="text-center text-foreground/80 max-w-3xl mx-auto mb-10 leading-relaxed text-sm md:text-base">
            {intro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
            {items.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div
                  key={i}
                  className="group flex items-start gap-4 rounded-xl p-3 -m-3 transition-all hover:bg-primary/5"
                >
                  <div className="shrink-0 relative">
                    <div className="absolute inset-0 rounded-full bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center ring-2 ring-primary/40 shadow-lg">
                      <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground mb-1 text-base">{item.title}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{item.description}</p>
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

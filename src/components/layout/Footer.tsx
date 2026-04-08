import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import paymentsImgFallback from '@/assets/payments.webp';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEFAULTS = {
  footer_bg_color: '#011D3E',
  footer_text_color: '#ffffff',
  footer_copyright: '© {year} Toolsmandu. All rights reserved.',
  footer_reviews_title: 'Check Our Reviews',
  footer_trustpilot_image: 'https://iuussfrylzowigmaozwv.supabase.co/storage/v1/object/public/assets/media/1775494932262-m7k4sg8o5zs.webp',
  footer_trustpilot_link: 'https://link.toolsmandu.com/trustpilot',
  footer_google_image: 'https://iuussfrylzowigmaozwv.supabase.co/storage/v1/object/public/assets/media/1775494931231-3rpqqvt644i.webp',
  footer_google_link: 'https://link.toolsmandu.com/googlereviews',
};

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const { data: footerLinks } = useQuery({
    queryKey: ['footer-links'],
    queryFn: async () => {
      const { data } = await supabase.from('footer_links').select('*').order('sort_order');
      return data || [];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      return data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string | null>) || {};
    },
  });

  const s = (key: keyof typeof DEFAULTS) => settings?.[key] || DEFAULTS[key];

  const columns = footerLinks?.reduce((acc, link) => {
    if (!acc[link.column_name]) acc[link.column_name] = [];
    acc[link.column_name].push(link);
    return acc;
  }, {} as Record<string, typeof footerLinks>) || {};

  const bgColor = s('footer_bg_color');
  const textColor = s('footer_text_color');
  const copyrightText = s('footer_copyright').replace('{year}', String(new Date().getFullYear()));
  const reviewsTitle = s('footer_reviews_title');
  const trustpilotImg = s('footer_trustpilot_image');
  const trustpilotLink = s('footer_trustpilot_link');
  const googleImg = s('footer_google_image');
  const googleLink = s('footer_google_link');
  const paymentImg = settings?.footer_payment_image || paymentsImgFallback;

  return (
    <footer ref={ref} className="border-t border-border mt-16" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* About */}
          <div className="md:col-span-2">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Toolsmandu" className="h-8 object-contain" />
              ) : (
                <><span className="text-primary">Tools</span>mandu</>
              )}
            </Link>
            <div className="mt-4 text-sm leading-relaxed prose prose-sm prose-invert max-w-none" style={{ color: textColor }} dangerouslySetInnerHTML={{ __html: settings?.footer_about || 'Your trusted destination for premium digital software subscriptions.' }} />
          </div>

          <div className="hidden md:block" />

          {/* Link columns - ordered */}
          {['Information', 'Our Policy', 'Support'].filter(name => columns[name]).map(name => [name, columns[name]] as const).concat(Object.entries(columns).filter(([name]) => !['Information', 'Our Policy', 'Support'].includes(name)) as any).map(([name, links]) => (
            <div key={name}>
              <h3 className="font-semibold mb-4" style={{ color: textColor }}>{name}</h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.id}>
                    <Link to={link.url} className="text-sm hover:underline transition-colors" style={{ color: `${textColor}cc` }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-8 pt-8 text-sm flex items-center justify-between" style={{ borderColor: `${textColor}33`, color: `${textColor}b3` }}>
          <span>{copyrightText}</span>
          {paymentImg && <img src={paymentImg} alt="Payment methods" className="h-6 object-contain" />}
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;

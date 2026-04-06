import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  const columns = footerLinks?.reduce((acc, link) => {
    if (!acc[link.column_name]) acc[link.column_name] = [];
    acc[link.column_name].push(link);
    return acc;
  }, {} as Record<string, typeof footerLinks>) || {};

  return (
    <footer ref={ref} className="bg-card border-t border-border mt-16">
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
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {settings?.footer_about || 'Your trusted destination for premium digital software subscriptions.'}
            </p>
          </div>

          <div className="hidden md:block" />

          {/* Link columns - ordered */}
          {['Information', 'Our Policy', 'Support'].filter(name => columns[name]).map(name => [name, columns[name]] as const).concat(Object.entries(columns).filter(([name]) => !['Information', 'Our Policy', 'Support'].includes(name)) as any).map(([name, links]) => (
            <div key={name}>
              <h3 className="font-semibold text-foreground mb-4">{name}</h3>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.id}>
                    <Link to={link.url} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Toolsmandu. All rights reserved.
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;

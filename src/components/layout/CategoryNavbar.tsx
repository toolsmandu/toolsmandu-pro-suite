import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { icons } from 'lucide-react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavMenuItem = {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

const CategoryNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: items } = useQuery({
    queryKey: ['nav-menu-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('nav_menu_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return (data || []) as NavMenuItem[];
    },
  });

  if (!items?.length) return null;

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const LucideIcon = (icons as Record<string, any>)[iconName];
    if (!LucideIcon) return null;
    return <LucideIcon className="h-4 w-4 text-white" />;
  };

  const isExternal = (url: string) => url.startsWith('http');

  return (
    <nav className="hidden lg:block bg-secondary/50 border-b border-border mb-4">
      <div className="container mx-auto px-4">
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1 h-10 overflow-x-auto">
          {items.map((item) => {
            const content = (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold uppercase text-white hover:text-white/80 transition-colors rounded-md hover:bg-secondary">
                {renderIcon(item.icon)}
                {item.label}
              </span>
            );
            return isExternal(item.url) ? (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">{content}</a>
            ) : (
              <Link key={item.id} to={item.url}>{content}</Link>
            );
          })}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between h-10">
          <span className="text-sm text-white font-medium">Menu</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        {mobileOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {items.map((item) => {
              const content = (
                <span className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-white/80 transition-colors rounded-md hover:bg-secondary">
                  {renderIcon(item.icon)}
                  {item.label}
                </span>
              );
              return isExternal(item.url) ? (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>{content}</a>
              ) : (
                <Link key={item.id} to={item.url} onClick={() => setMobileOpen(false)}>{content}</Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default CategoryNavbar;

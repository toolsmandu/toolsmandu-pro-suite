import { useState, useEffect } from 'react';
import trustpilotImg from '@/assets/trustpilot.webp';
import googleReviewsImg from '@/assets/google-reviews.webp';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAdmin, isEditor, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      return data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string | null>) || {};
    },
  });

  // Dynamic favicon
  useEffect(() => {
    if (settings?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings?.favicon_url]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs py-2">
        <div className="container mx-auto px-4 gap-6 md:gap-12 flex-row flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-12">
            <span>🔒 100% Safe & Secure</span>
            <span>⚡ Instant Delivery</span>
            <span>🎧 24/7 Support</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://link.toolsmandu.com/trustpilot" target="_blank" rel="noopener noreferrer">
              <img src={trustpilotImg} alt="Trustpilot Reviews" className="h-[14px] w-auto object-contain" />
            </a>
            <a href="https://link.toolsmandu.com/googlereviews" target="_blank" rel="noopener noreferrer">
              <img src={googleReviewsImg} alt="Google Reviews" className="h-4 object-contain" />
            </a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-md shadow-lg shadow-primary/5' : 'bg-background/80 backdrop-blur-sm'} border-b border-border`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-xl font-bold text-foreground flex items-center gap-2">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Toolsmandu" className="h-8 object-contain" />
              ) : (
                <><span className="text-primary">Tools</span>mandu</>
              )}
            </Link>

            {/* Desktop search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </form>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              {user && (
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/wishlist')} aria-label="Wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')} aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                    {itemCount}
                  </Badge>
                )}
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/orders')}>My Orders</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/tickets')}>Support</DropdownMenuItem>
                    {(isAdmin || isEditor) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>Admin Panel</DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                  <Button size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="flex md:hidden items-center gap-2">
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                    {itemCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3 border-t border-border pt-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary" />
                </div>
              </form>
              {user ? (
                <>
                  <Link to="/dashboard" className="block py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                  <Link to="/dashboard/orders" className="block py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                  <Link to="/dashboard/tickets" className="block py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>Support</Link>
                  {(isAdmin || isEditor) && (
                    <Link to="/admin" className="block py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
                  )}
                  <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="block py-2 text-destructive">Sign Out</button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Login</Button>
                  <Button size="sm" className="flex-1" onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}>Sign Up</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;

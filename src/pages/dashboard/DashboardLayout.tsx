import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { User, Package, MessageCircle, Heart } from 'lucide-react';

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;

  const links = [
    { to: '/dashboard', icon: User, label: 'Profile', end: true },
    { to: '/dashboard/orders', icon: Package, label: 'Orders' },
    { to: '/dashboard/tickets', icon: MessageCircle, label: 'Tickets' },
    { to: '/dashboard/wishlist', icon: Heart, label: 'Wishlist' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <nav className="flex items-center gap-2 border-b border-border overflow-x-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
};

export default DashboardLayout;

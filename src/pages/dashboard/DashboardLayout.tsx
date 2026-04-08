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
    <div className="container mx-auto px-4 py-8">
      
      <div className="grid lg:grid-cols-4 gap-8">
        <nav className="space-y-1">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

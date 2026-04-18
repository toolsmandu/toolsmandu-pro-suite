import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { User, Package, AlertCircle } from 'lucide-react';

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
    { to: '/dashboard/report-problem', icon: AlertCircle, label: 'Report a Problem' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <nav className="flex items-center justify-center gap-2 bg-muted/30 rounded-xl p-2 overflow-x-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:bg-muted/50'}`
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

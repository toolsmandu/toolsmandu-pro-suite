import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Image, MessageCircle, Users, Settings } from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/hero-slides', icon: Image, label: 'Hero Slider' },
  { to: '/admin/tickets', icon: MessageCircle, label: 'Tickets' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminLayout = () => {
  const { user, loading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isEditor))) navigate('/');
  }, [user, loading, isAdmin, isEditor, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user || (!isAdmin && !isEditor)) return null;

  const visibleLinks = adminLinks.filter(l => {
    if (isEditor && (l.to === '/admin/users' || l.to === '/admin/settings')) return false;
    return true;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleLinks.map(({ to, icon: Icon, label, end }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={to} end={end} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <Icon className="mr-2 h-4 w-4" />
                          <span>{label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-foreground">Toolsmandu Admin</h1>
            <div className="ml-auto">
              <a href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Store</a>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;

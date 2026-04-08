import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem,
  SidebarMenuSubButton, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Image, MessageCircle, Users, Settings, ChevronRight, Tag, Film, HelpCircle, Share2 } from 'lucide-react';

const AdminLayout = () => {
  const { user, loading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isProductsSection = location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/admin/categories') || location.pathname.startsWith('/admin/product-types');
  const [productsOpen, setProductsOpen] = useState(isProductsSection);

  useEffect(() => {
    if (isProductsSection) setProductsOpen(true);
  }, [isProductsSection]);

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isEditor))) navigate('/');
  }, [user, loading, isAdmin, isEditor, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user || (!isAdmin && !isEditor)) return null;

  const topLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ];

  const bottomLinks = [
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/media', icon: Film, label: 'Media' },
    { to: '/admin/hero-slides', icon: Image, label: 'Hero Slider' },
    { to: '/admin/faqs', icon: HelpCircle, label: 'FAQs' },
    { to: '/admin/family-sharing', icon: Share2, label: 'Family Sharing' },
    { to: '/admin/tickets', icon: MessageCircle, label: 'Tickets' },
    ...(isAdmin ? [{ to: '/admin/users', icon: Users, label: 'Users' }] : []),
    ...(isAdmin ? [{ to: '/admin/settings', icon: Settings, label: 'Settings' }] : []),
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {topLinks.map(({ to, icon: Icon, label, end }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={to} end={end} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <Icon className="mr-2 h-4 w-4" />
                          <span>{label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {/* Products with Categories sub-menu */}
                  <Collapsible open={productsOpen} onOpenChange={setProductsOpen} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="hover:bg-muted/50">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Products</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/products" end className="hover:bg-muted/50" activeClassName="text-primary font-medium">
                                <Package className="mr-2 h-3 w-3" />
                                <span>All Products</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/categories" className="hover:bg-muted/50" activeClassName="text-primary font-medium">
                                <FolderOpen className="mr-2 h-3 w-3" />
                                <span>Categories</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/product-types" className="hover:bg-muted/50" activeClassName="text-primary font-medium">
                                <Tag className="mr-2 h-3 w-3" />
                                <span>Product Types</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  {bottomLinks.map(({ to, icon: Icon, label }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={to} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
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
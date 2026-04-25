import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem,
  SidebarMenuSubButton, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
  import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Image, Users, Settings, ChevronRight, Tag, Film, HelpCircle, Share2, Globe, ShoppingBag, Menu, PanelBottom, Ticket, Zap, StickyNote, Newspaper, Mail, FormInput, Bell } from 'lucide-react';

const AdminLayout = () => {
  const { user, loading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: logoUrl } = useQuery({
    queryKey: ['admin-logo-url'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle();
      return (data?.value as string | null) ?? null;
    },
  });

  const isProductsSection = location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/admin/categories') || location.pathname.startsWith('/admin/product-types') || location.pathname.startsWith('/admin/coupons') || location.pathname.startsWith('/admin/input-fields') || location.pathname.startsWith('/admin/flash-sale-labels') || location.pathname.startsWith('/admin/faqs');
  const isSettingsSection = location.pathname.startsWith('/admin/settings') || location.pathname.startsWith('/admin/hero-slides');
  const [productsOpen, setProductsOpen] = useState(isProductsSection);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsSection);

  useEffect(() => {
    if (isProductsSection) setProductsOpen(true);
  }, [isProductsSection]);

  useEffect(() => {
    if (isSettingsSection) setSettingsOpen(true);
  }, [isSettingsSection]);

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isEditor))) navigate('/');
  }, [user, loading, isAdmin, isEditor, navigate]);

  // Apply admin-light class to body so portaled elements (dialogs, popovers) inherit admin theme
  useEffect(() => {
    document.body.classList.add('admin-light');
    return () => { document.body.classList.remove('admin-light'); };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user || (!isAdmin && !isEditor)) return null;

  const topLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ];

  const bottomLinks = [
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/expired-orders', icon: ShoppingCart, label: 'Expired Orders' },
    { to: '/admin/family-sharing', icon: Share2, label: 'Family Sharing' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
    { to: '/admin/notes', icon: StickyNote, label: 'Notes' },
    { to: '/admin/blogs', icon: Newspaper, label: 'Blogs' },
    { to: '/admin/media', icon: Film, label: 'Media' },
  ];

  return (
    <SidebarProvider>
      <div className="admin-light min-h-screen flex w-full bg-background text-foreground">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {topLinks.map(({ to, icon: Icon, label, end }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={to} end={end} className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
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
                              <NavLink to="/admin/products" end className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <Package className="mr-2 h-3 w-3" />
                                <span>All Products</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/categories" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <FolderOpen className="mr-2 h-3 w-3" />
                                <span>Categories</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/product-types" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <Tag className="mr-2 h-3 w-3" />
                                <span>Product Types</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/coupons" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <Ticket className="mr-2 h-3 w-3" />
                                <span>Coupons</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/input-fields" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <FormInput className="mr-2 h-3 w-3" />
                                <span>Input Fields</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/flash-sale-labels" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <Zap className="mr-2 h-3 w-3" />
                                <span>Flash Sale Labels</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/faqs" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <HelpCircle className="mr-2 h-3 w-3" />
                                <span>FAQs</span>
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
                        <NavLink to={to} className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                          <Icon className="mr-2 h-4 w-4" />
                          <span className="flex-1">{label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {/* Waiting List (admin/editor) — placed just above Settings */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/waiting-list" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <Bell className="mr-2 h-4 w-4" />
                        <span className="flex-1">Waiting List</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Settings sub-menu (admin only) */}
                  {isAdmin && (
                    <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="group/settings">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-muted/50">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/settings:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/settings/site" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <Globe className="mr-2 h-3 w-3" />
                                  <span>Site Setting</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/settings/order-mode" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <ShoppingBag className="mr-2 h-3 w-3" />
                                  <span>Order Mode</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/settings/top-menu" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <Menu className="mr-2 h-3 w-3" />
                                  <span>Top Menu</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/settings/footer" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <PanelBottom className="mr-2 h-3 w-3" />
                                  <span>Footer</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/hero-slides" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <Image className="mr-2 h-3 w-3" />
                                  <span>Slider Setting</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/settings/email-templates" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <Mail className="mr-2 h-3 w-3" />
                                  <span>Email Templates</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 gap-4 bg-background">
            <SidebarTrigger className="text-foreground" />
            <h1 className="font-semibold text-foreground">Toolsmandu Admin</h1>
            <div className="ml-auto">
              <a href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Store</a>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem,
  SidebarMenuSubButton, SidebarProvider, useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard.js';
import Package from 'lucide-react/dist/esm/icons/package.js';
import FolderOpen from 'lucide-react/dist/esm/icons/folder-open.js';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart.js';
import Image from 'lucide-react/dist/esm/icons/image.js';
import Users from 'lucide-react/dist/esm/icons/users.js';
import Settings from 'lucide-react/dist/esm/icons/settings.js';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js';
import Tag from 'lucide-react/dist/esm/icons/tag.js';
import Film from 'lucide-react/dist/esm/icons/film.js';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle.js';
import Share2 from 'lucide-react/dist/esm/icons/share-2.js';
import Globe from 'lucide-react/dist/esm/icons/globe.js';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js';
import Menu from 'lucide-react/dist/esm/icons/menu.js';
import PanelBottom from 'lucide-react/dist/esm/icons/panel-bottom.js';
import Ticket from 'lucide-react/dist/esm/icons/ticket.js';
import Zap from 'lucide-react/dist/esm/icons/zap.js';
import StickyNote from 'lucide-react/dist/esm/icons/sticky-note.js';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper.js';
import Mail from 'lucide-react/dist/esm/icons/mail.js';
import FormInput from 'lucide-react/dist/esm/icons/form-input.js';
import Bell from 'lucide-react/dist/esm/icons/bell.js';
import BadgePercent from 'lucide-react/dist/esm/icons/badge-percent.js';
import KeyRound from 'lucide-react/dist/esm/icons/key-round.js';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3.js';
import FileBarChart from 'lucide-react/dist/esm/icons/file-bar-chart.js';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.js';
import BookOpen from 'lucide-react/dist/esm/icons/book-open.js';
import ListChecks from 'lucide-react/dist/esm/icons/list-checks.js';
import LogOut from 'lucide-react/dist/esm/icons/log-out.js';
import Wrench from 'lucide-react/dist/esm/icons/wrench.js';
import Table from 'lucide-react/dist/esm/icons/table.js';
import Network from 'lucide-react/dist/esm/icons/network.js';
import Layout from 'lucide-react/dist/esm/icons/layout.js';
const ChatbotWidget = lazy(() => import('@/components/admin/ChatbotWidget'));
const SalesStatsBar = lazy(() => import('@/components/admin/SalesStatsBar'));
const EditorTaskStatsBar = lazy(() => import('@/components/admin/EditorTaskStatsBar'));
import { Button } from '@/components/ui/button';

const MenuTrigger = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-foreground shrink-0 h-8 w-8" aria-label="Toggle menu">
      <Menu className="h-5 w-5" />
    </Button>
  );
};

const MobileAutoClose = () => {
  const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname, isMobile, setOpenMobile]);
  return null;
};

const AdminLayout = () => {
  const { user, loading, rolesLoading, isAdmin, isEditor, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: logoUrl } = useQuery({
    queryKey: ['site-logo-url'],
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle();
      return data?.value || '';
    },
  });

  const isProductsSection = location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/admin/categories') || location.pathname.startsWith('/admin/product-types') || location.pathname.startsWith('/admin/coupons') || location.pathname.startsWith('/admin/input-fields') || location.pathname.startsWith('/admin/flash-sale-labels') || location.pathname.startsWith('/admin/faqs') || location.pathname.startsWith('/admin/layout-section');
  const isSettingsSection = location.pathname.startsWith('/admin/settings') || location.pathname.startsWith('/admin/hero-slides');
  const isReportsSection = location.pathname.startsWith('/admin/reports');
  const isSheetsSection = location.pathname.startsWith('/admin/family-sheets');
  const [productsOpen, setProductsOpen] = useState(isProductsSection);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsSection);
  const [reportsOpen, setReportsOpen] = useState(isReportsSection);
  const [sheetsOpen, setSheetsOpen] = useState(isSheetsSection);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowChatbot(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isSheetsSection) setSheetsOpen(true);
  }, [isSheetsSection]);

  useEffect(() => {
    if (isProductsSection) setProductsOpen(true);
  }, [isProductsSection]);

  useEffect(() => {
    if (isSettingsSection) setSettingsOpen(true);
  }, [isSettingsSection]);

  useEffect(() => {
    if (isReportsSection) setReportsOpen(true);
  }, [isReportsSection]);

  useEffect(() => {
    if (!loading && !rolesLoading && (!user || (!isAdmin && !isEditor))) navigate('/');
  }, [user, loading, rolesLoading, isAdmin, isEditor, navigate]);

  // Apply admin-light class to body so portaled elements (dialogs, popovers) inherit admin theme
  useEffect(() => {
    document.body.classList.add('admin-light');
    return () => { document.body.classList.remove('admin-light'); };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return null;
  if (!rolesLoading && !isAdmin && !isEditor) return null;

  const topLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ];

  const bottomLinksBeforeReports = [
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/expired-orders', icon: ShoppingCart, label: 'Expired Orders' },
    { to: '/admin/family-sharing', icon: Share2, label: 'Family Sharing' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
  ];

  const bottomLinksAfterReports = [
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
              <SidebarGroupLabel className="h-auto py-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Site Logo" className="h-8 w-auto object-contain" />
                ) : null}
              </SidebarGroupLabel>
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
                              <NavLink to="/admin/product-tags" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <Zap className="mr-2 h-3 w-3" />
                                <span>Product Tags</span>
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
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild>
                              <NavLink to="/admin/layout-section" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                <Layout className="mr-2 h-3 w-3" />
                                <span>Layout Section</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  {bottomLinksBeforeReports.map(({ to, icon: Icon, label }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild>
                        <NavLink to={to} className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                          <Icon className="mr-2 h-4 w-4" />
                          <span className="flex-1">{label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {/* Sheets link */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/sheets" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <Table className="mr-2 h-4 w-4" />
                        <span>Sheets</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Family Sheets link */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/family-sheets" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <Network className="mr-2 h-4 w-4" />
                        <span>Family Sheets</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>


                  {/* Reports sub-menu (admin only) — just below Customers */}
                  {isAdmin && (
                    <Collapsible open={reportsOpen} onOpenChange={setReportsOpen} className="group/reports">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="hover:bg-muted/50">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Reports</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/reports:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/reports/sales-statement" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <FileBarChart className="mr-2 h-3 w-3" />
                                  <span>Sales Statement</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/reports/top-selling" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <TrendingUp className="mr-2 h-3 w-3" />
                                  <span>Top Selling</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/reports/customer-segment" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <Users className="mr-2 h-3 w-3" />
                                  <span>Customer Segment</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}

                  {bottomLinksAfterReports.map(({ to, icon: Icon, label }) => (
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

                  {/* License Keys (admin/editor) — just above Promo Codes */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/license-keys" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span className="flex-1">License Keys</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Promo Codes (admin/editor) — just above Settings */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/promo-codes" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <BadgePercent className="mr-2 h-4 w-4" />
                        <span className="flex-1">Promo Codes</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Knowledgebase — just above Settings */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/knowledgebase" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span className="flex-1">Knowledgebase</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Tasks — just below Knowledgebase */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/tasks" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <ListChecks className="mr-2 h-4 w-4" />
                        <span className="flex-1">Tasks</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Email Inbox (admin only) — just above Settings */}
                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/inbox" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                          <Mail className="mr-2 h-4 w-4" />
                          <span className="flex-1">Email Inbox</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

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
                                <NavLink to="/admin/settings/maintenance" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <Wrench className="mr-2 h-3 w-3" />
                                  <span>Maintenance Mode</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to="/admin/settings/homepage-seo" className="hover:bg-muted/50" activeClassName="font-medium admin-active-link">
                                  <FileBarChart className="mr-2 h-3 w-3" />
                                  <span>Homepage SEO Content</span>
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

                  {/* Free Tools — just below Settings */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin/free-tools" className="hover:bg-muted/50" activeClassName="bg-muted font-medium admin-active-link">
                        <Wrench className="mr-2 h-4 w-4" />
                        <span className="flex-1">Free Tools</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-2 sm:px-4 gap-2 sm:gap-4 bg-background sticky top-0 z-30 shrink-0 w-full overflow-hidden">
            <MenuTrigger />
            <MobileAutoClose />
            <Suspense fallback={null}>
              {!rolesLoading && isAdmin && <SalesStatsBar />}
              {!rolesLoading && !isAdmin && isEditor && <EditorTaskStatsBar />}
            </Suspense>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/inbox')}
                  className="justify-center px-2 sm:px-3"
                  aria-label="Inbox"
                >
                  <Mail className="h-4 w-4 mr-1.5 sm:mr-2" />
                  <span>Inbox</span>
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => { await signOut(); navigate('/'); }}
                className="justify-center px-2 sm:px-3"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto bg-muted/30 min-w-0">
            <Outlet />
          </main>
        </div>
        {showChatbot && (
          <Suspense fallback={null}>
            <ChatbotWidget />
          </Suspense>
        )}
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
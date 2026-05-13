import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

// Eager: needed for first paint of "/"
import MainLayout from "@/components/layout/MainLayout";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy: secondary public pages
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PaymentVerify = lazy(() => import("./pages/PaymentVerify"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const PublicInboxPage = lazy(() => import("./pages/PublicInboxPage"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const FreeTools = lazy(() => import("./pages/FreeTools"));
const FreeToolDetail = lazy(() => import("./pages/FreeToolDetail"));

// Lazy: dashboard
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const ProfilePage = lazy(() => import("./pages/dashboard/ProfilePage"));
const OrdersPage = lazy(() => import("./pages/dashboard/OrdersPage"));
const ReportProblemPage = lazy(() => import("./pages/dashboard/ReportProblemPage"));
const DashboardInboxPage = lazy(() => import("./pages/dashboard/InboxPage"));

// Lazy: admin
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductCustomTemplate = lazy(() => import("./pages/admin/AdminProductCustomTemplate"));
const AdminCustomTemplates = lazy(() => import("./pages/admin/AdminCustomTemplates"));
const AdminLayoutSectionPreview = lazy(() => import("./pages/admin/AdminLayoutSectionPreview"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminProductTypes = lazy(() => import("./pages/admin/AdminProductTypes"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminInputFields = lazy(() => import("./pages/admin/AdminInputFields"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminExpiredOrders = lazy(() => import("./pages/admin/AdminExpiredOrders"));
const AdminHeroSlides = lazy(() => import("./pages/admin/AdminHeroSlides"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSiteSettings = lazy(() => import("./pages/admin/settings/AdminSiteSettings"));
const AdminOrderMode = lazy(() => import("./pages/admin/settings/AdminOrderMode"));
const AdminTopMenu = lazy(() => import("./pages/admin/settings/AdminTopMenu"));
const AdminFooter = lazy(() => import("./pages/admin/settings/AdminFooter"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/settings/AdminEmailTemplates"));
const AdminMaintenance = lazy(() => import("./pages/admin/settings/AdminMaintenance"));
const AdminHomepageSeo = lazy(() => import("./pages/admin/settings/AdminHomepageSeo"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminFAQs = lazy(() => import("./pages/admin/AdminFAQs"));
const AdminFamilySharing = lazy(() => import("./pages/admin/AdminFamilySharing"));
const AdminFamilySharingDetail = lazy(() => import("./pages/admin/AdminFamilySharingDetail"));
const AdminSheets = lazy(() => import("./pages/admin/AdminSheets"));
const AdminSimpleSheets = lazy(() => import("./pages/admin/AdminSimpleSheets"));
const AdminSheetDetail = lazy(() => import("./pages/admin/AdminSheetDetail"));
const AdminCredentialDetail = lazy(() => import("./pages/admin/AdminCredentialDetail"));
const AdminFlashSaleLabels = lazy(() => import("./pages/admin/AdminFlashSaleLabels"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminNotes = lazy(() => import("./pages/admin/AdminNotes"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const AdminBlogEditor = lazy(() => import("./pages/admin/AdminBlogEditor"));
const AdminWaitingList = lazy(() => import("./pages/admin/AdminWaitingList"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminLicenseKeys = lazy(() => import("./pages/admin/AdminLicenseKeys"));
const AdminSalesStatement = lazy(() => import("./pages/admin/reports/AdminSalesStatement"));
const AdminTopSelling = lazy(() => import("./pages/admin/reports/AdminTopSelling"));
const AdminCustomerSegment = lazy(() => import("./pages/admin/reports/AdminCustomerSegment"));
const AdminKnowledgebase = lazy(() => import("./pages/admin/AdminKnowledgebase"));
const AdminDisposableInbox = lazy(() => import("./pages/admin/AdminDisposableInbox"));
const AdminTasksList = lazy(() => import("./pages/admin/tasks/AdminTasksList"));
const AdminTaskEditor = lazy(() => import("./pages/admin/tasks/AdminTaskEditor"));
const AdminTaskDetail = lazy(() => import("./pages/admin/tasks/AdminTaskDetail"));
const AdminTaskRecurring = lazy(() => import("./pages/admin/tasks/AdminTaskRecurring"));
const AdminTaskDashboard = lazy(() => import("./pages/admin/tasks/AdminTaskDashboard"));
const AdminFreeTools = lazy(() => import("./pages/admin/AdminFreeTools"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/item/:slug" element={<ProductPage />} />
                  <Route path="/item-category/:slug" element={<CategoryPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/payment/verify" element={<PaymentVerify />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/inbox" element={<PublicInboxPage />} />
                  <Route path="/blog" element={<BlogList />} />
                  <Route path="/free-tools" element={<FreeTools />} />
                  <Route path="/free-tools/:slug" element={<FreeToolDetail />} />
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<ProfilePage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="report-problem" element={<ReportProblemPage />} />
                    <Route path="inbox" element={<DashboardInboxPage />} />
                  </Route>

                  <Route path="/:slug" element={<BlogPost />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/:id/template" element={<AdminProductCustomTemplate />} />
                  <Route path="layout-section" element={<AdminCustomTemplates />} />
                  <Route path="layout-section/preview/:type" element={<AdminLayoutSectionPreview />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="product-types" element={<AdminProductTypes />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="input-fields" element={<AdminInputFields />} />
                  <Route path="product-tags" element={<AdminFlashSaleLabels />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="expired-orders" element={<AdminExpiredOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="notes" element={<AdminNotes />} />
                  <Route path="blogs" element={<AdminBlogs />} />
                  <Route path="blogs/:id" element={<AdminBlogEditor />} />
                  <Route path="hero-slides" element={<AdminHeroSlides />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="waiting-list" element={<AdminWaitingList />} />
                  <Route path="promo-codes" element={<AdminPromoCodes />} />
                  <Route path="license-keys" element={<AdminLicenseKeys />} />
                  <Route path="reports/sales-statement" element={<AdminSalesStatement />} />
                  <Route path="reports/top-selling" element={<AdminTopSelling />} />
                  <Route path="reports/customer-segment" element={<AdminCustomerSegment />} />
                  <Route path="knowledgebase" element={<AdminKnowledgebase />} />
                  <Route path="inbox" element={<AdminDisposableInbox />} />
                  <Route path="tasks" element={<AdminTasksList />} />
                  <Route path="tasks/dashboard" element={<AdminTaskDashboard />} />
                  <Route path="tasks/recurring" element={<AdminTaskRecurring />} />
                  <Route path="tasks/new" element={<AdminTaskEditor />} />
                  <Route path="tasks/:id" element={<AdminTaskDetail />} />
                  <Route path="tasks/:id/edit" element={<AdminTaskEditor />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="settings/site" element={<AdminSiteSettings />} />
                  <Route path="settings/order-mode" element={<AdminOrderMode />} />
                  <Route path="settings/top-menu" element={<AdminTopMenu />} />
                  <Route path="settings/footer" element={<AdminFooter />} />
                  <Route path="settings/email-templates" element={<AdminEmailTemplates />} />
                  <Route path="settings/maintenance" element={<AdminMaintenance />} />
                  <Route path="settings/homepage-seo" element={<AdminHomepageSeo />} />
                  <Route path="faqs" element={<AdminFAQs />} />
                  <Route path="family-sharing" element={<AdminFamilySharing />} />
                  <Route path="family-sharing/:id" element={<AdminFamilySharingDetail />} />
                  <Route path="family-sharing/:id/credential/:credentialId" element={<AdminCredentialDetail />} />
                  <Route path="family-sheets" element={<AdminSheets />} />
                  <Route path="family-sheets/:id" element={<AdminSheetDetail />} />
                  <Route path="sheets" element={<AdminSimpleSheets />} />
                  <Route path="sheets/:id" element={<AdminSheetDetail />} />
                  <Route path="free-tools" element={<AdminFreeTools />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

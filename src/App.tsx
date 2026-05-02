import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

import MainLayout from "@/components/layout/MainLayout";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import CartPage from "./pages/CartPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PaymentVerify from "./pages/PaymentVerify";
import Unsubscribe from "./pages/Unsubscribe";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import ProfilePage from "./pages/dashboard/ProfilePage";
import OrdersPage from "./pages/dashboard/OrdersPage";
import ReportProblemPage from "./pages/dashboard/ReportProblemPage";



import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminProductTypes from "./pages/admin/AdminProductTypes";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminInputFields from "./pages/admin/AdminInputFields";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminExpiredOrders from "./pages/admin/AdminExpiredOrders";
import AdminHeroSlides from "./pages/admin/AdminHeroSlides";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSiteSettings from "./pages/admin/settings/AdminSiteSettings";
import AdminOrderMode from "./pages/admin/settings/AdminOrderMode";
import AdminTopMenu from "./pages/admin/settings/AdminTopMenu";
import AdminFooter from "./pages/admin/settings/AdminFooter";
import AdminEmailTemplates from "./pages/admin/settings/AdminEmailTemplates";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminFAQs from "./pages/admin/AdminFAQs";
import AdminFamilySharing from "./pages/admin/AdminFamilySharing";
import AdminFamilySharingDetail from "./pages/admin/AdminFamilySharingDetail";
import AdminCredentialDetail from "./pages/admin/AdminCredentialDetail";
import AdminFlashSaleLabels from "./pages/admin/AdminFlashSaleLabels";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminNotes from "./pages/admin/AdminNotes";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminBlogEditor from "./pages/admin/AdminBlogEditor";
import AdminWaitingList from "./pages/admin/AdminWaitingList";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminLicenseKeys from "./pages/admin/AdminLicenseKeys";
import AdminSalesStatement from "./pages/admin/reports/AdminSalesStatement";
import AdminTopSelling from "./pages/admin/reports/AdminTopSelling";
import AdminCustomerSegment from "./pages/admin/reports/AdminCustomerSegment";
import AdminKnowledgebase from "./pages/admin/AdminKnowledgebase";
import AdminDisposableInbox from "./pages/admin/AdminDisposableInbox";
import DashboardInboxPage from "./pages/dashboard/InboxPage";

import AdminTasksList from "./pages/admin/tasks/AdminTasksList";
import AdminTaskEditor from "./pages/admin/tasks/AdminTaskEditor";
import AdminTaskDetail from "./pages/admin/tasks/AdminTaskDetail";
import AdminTaskRecurring from "./pages/admin/tasks/AdminTaskRecurring";
import AdminTaskDashboard from "./pages/admin/tasks/AdminTaskDashboard";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
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
                <Route path="/blog" element={<BlogList />} />
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
                <Route path="faqs" element={<AdminFAQs />} />
                <Route path="family-sharing" element={<AdminFamilySharing />} />
                <Route path="family-sharing/:id" element={<AdminFamilySharingDetail />} />
                <Route path="family-sharing/:id/credential/:credentialId" element={<AdminCredentialDetail />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

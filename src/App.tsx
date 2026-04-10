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

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import ProfilePage from "./pages/dashboard/ProfilePage";
import OrdersPage from "./pages/dashboard/OrdersPage";
import TicketsPage from "./pages/dashboard/TicketsPage";
import WishlistPage from "./pages/dashboard/WishlistPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminProductTypes from "./pages/admin/AdminProductTypes";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminHeroSlides from "./pages/admin/AdminHeroSlides";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSiteSettings from "./pages/admin/settings/AdminSiteSettings";
import AdminOrderMode from "./pages/admin/settings/AdminOrderMode";
import AdminTopMenu from "./pages/admin/settings/AdminTopMenu";
import AdminFooter from "./pages/admin/settings/AdminFooter";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminFAQs from "./pages/admin/AdminFAQs";
import AdminFamilySharing from "./pages/admin/AdminFamilySharing";
import AdminFamilySharingDetail from "./pages/admin/AdminFamilySharingDetail";
import AdminCredentialDetail from "./pages/admin/AdminCredentialDetail";
import AdminFlashSaleLabels from "./pages/admin/AdminFlashSaleLabels";
import AdminCustomers from "./pages/admin/AdminCustomers";

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
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<ProfilePage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="tickets" element={<TicketsPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="product-types" element={<AdminProductTypes />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="flash-sale-labels" element={<AdminFlashSaleLabels />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="hero-slides" element={<AdminHeroSlides />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="settings/site" element={<AdminSiteSettings />} />
                <Route path="settings/order-mode" element={<AdminOrderMode />} />
                <Route path="settings/top-menu" element={<AdminTopMenu />} />
                <Route path="settings/footer" element={<AdminFooter />} />
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

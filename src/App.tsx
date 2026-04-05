import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

import MainLayout from "@/components/layout/MainLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProductPage from "./pages/ProductPage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import CartPage from "./pages/CartPage";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import ProfilePage from "./pages/dashboard/ProfilePage";
import OrdersPage from "./pages/dashboard/OrdersPage";
import TicketsPage from "./pages/dashboard/TicketsPage";
import WishlistPage from "./pages/dashboard/WishlistPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminHeroSlides from "./pages/admin/AdminHeroSlides";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/product/:slug" element={<ProductPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<ProfilePage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="tickets" element={<TicketsPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                </Route>
              </Route>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="hero-slides" element={<AdminHeroSlides />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

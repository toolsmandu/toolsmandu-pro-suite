

# Toolsmandu — Digital Subscriptions E-Commerce Platform

## Overview
A modern, production-ready e-commerce website for selling digital software subscriptions. Dark blue gradient theme (#1e3a8a), clean sans-serif typography, fully responsive. No payment integration for now — orders are placed and managed manually by admin.

---

## 🗄️ Backend (Lovable Cloud / Supabase)

### Database Tables
- **profiles** — user_id, email, phone (with country code), avatar_url, created_at
- **user_roles** — user_id, role (enum: admin, editor, customer)
- **categories** — id, name, slug, icon, sort_order
- **products** — id, name, slug, description, features (JSON), price, original_price, duration, image_url, category_id, is_featured, is_bestseller, is_flash_sale, flash_sale_label, rating, meta_title, meta_description, created_at
- **hero_slides** — id, image_url, link_url, sort_order, is_active
- **orders** — id, user_id, status (processing/completed/cancelled/refunded), total, created_at
- **order_items** — id, order_id, product_id, price, quantity
- **tickets** — id, user_id, subject, status (open/closed), created_at
- **ticket_messages** — id, ticket_id, sender_id, message, created_at
- **site_settings** — key/value store for logo URL, footer text, etc.
- **footer_links** — id, column_name, label, url, sort_order
- **wishlist** — id, user_id, product_id

### Auth & Roles
- Email + password auth via Supabase Auth
- WhatsApp number stored in profiles (validated format, no real-time WhatsApp check — API doesn't support that publicly)
- RLS policies on all tables
- Security definer `has_role()` function for role checks
- Seed admin user: support@toolsmandu.com

---

## 📄 Pages & Features

### 1. Homepage
- **Top bar**: Trust signals (100% Safe, 24/7 Support, Instant Delivery)
- **Sticky navbar**: Logo, search bar with live filtering, cart icon with badge, user menu, mobile hamburger
- **Hero slider**: 3 images visible at once, auto-slides every 5s, admin-configurable
- **Flash Sale / Featured products**: 6-9 product cards with badges, ratings, pricing
- **"Why Buy From Us"**: 3 trust signal cards (Instant Delivery, After-sales Support, Service Warranty)
- **Best Sellers section**
- **Category sections**: Each category with horizontal scrollable product cards (left/right arrows)
- **Footer**: About column + 4 link columns (Information, Our Policy, Support, More) — all admin-configurable
- **Back-to-top button**

### 2. Product Page (matching current toolsmandu.com style)
- Large product image, name, rating, price with strikethrough original price
- Duration/subscription period
- Features list
- Description with rich text
- Buy Now / Add to Cart buttons
- Related products section
- SEO meta tags

### 3. Category Page
- Grid of products filtered by category
- Sort/filter options

### 4. Cart Page
- Persistent cart (localStorage)
- Item list with quantity controls, remove button
- Order summary with total
- Place Order button (creates order with "processing" status)
- Empty cart state

### 5. Search Results Page
- Live search from navbar
- Product grid with empty state

### 6. Auth Pages
- **Signup**: Email, WhatsApp number (country code selector + phone), password, confirm password
- **Login**: Email + password
- Clean, centered card design

### 7. Customer Dashboard (/dashboard)
- **Profile**: Edit email, phone, password
- **Orders**: List all orders with status badges (processing/completed/cancelled/refunded)
- **Tickets**: Create new ticket, view ticket list, reply to tickets, close tickets

### 8. Admin Panel (/admin) — separate layout with sidebar
- **Dashboard overview**: Order count summaries by status
- **Products**: Full CRUD — add/edit/delete products, set featured/bestseller/flash-sale flags, assign categories
- **Categories**: CRUD for categories with icons and sort order
- **Orders**: View all orders, change status (processing → completed/cancelled/refunded)
- **Hero Slider**: Upload images, set links, reorder, toggle active
- **Tickets**: View and reply to all customer tickets
- **Users**: View users, assign roles (admin/editor/customer)
- **Site Settings**: Upload logo, edit footer text and links
- Editor role: same as admin but cannot manage users or site settings

### 9. 404 Page
- Friendly design with navigation back to home

---

## 🎨 Design System
- **Background**: Dark navy (#0f172a to #1e3a8a gradient)
- **Primary**: Blue-900 (#1e3a8a) with lighter blue accents
- **Cards**: Semi-transparent dark cards with subtle borders
- **Text**: White headings, gray-300 body text
- **Font**: Inter (clean sans-serif)
- **Radius**: Rounded-lg (8px)
- **Fully responsive**: Mobile 375px, tablet 768px, desktop 1280px+

---

## ⚙️ UX Features
- Persistent shopping cart via localStorage
- Cart badge count on navbar
- Toast notifications for cart actions
- Wishlist/Save for Later on product cards
- Loading skeleton screens
- Empty states for cart, search, orders
- Semantic HTML + Open Graph tags + alt text on all images
- Scroll-aware sticky navbar with shadow


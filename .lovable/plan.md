

# Khalti Payment Gateway Integration

## Overview
Integrate Khalti (Nepal's payment gateway) into Toolsmandu's checkout flow. Khalti uses a server-initiated payment model: your backend creates a payment, the user is redirected to Khalti to pay, then redirected back where the backend verifies the payment.

## Flow
```text
Cart → "Pay with Khalti" → Edge Function initiates payment → User redirected to Khalti →
User pays → Redirected back to /payment/verify → Edge Function verifies → Order created → Dashboard
```

## What You Need First
- A **Khalti Merchant Account** — sign up at [test-admin.khalti.com](https://test-admin.khalti.com) for sandbox or [admin.khalti.com](https://admin.khalti.com) for production
- Your **Live Secret Key** from the Khalti merchant dashboard
- Use OTP `987654` and test Khalti ID `9800000000` for sandbox testing

## Technical Plan

### Step 1: Store Khalti Secret Key
- Use the secrets tool to securely store `KHALTI_SECRET_KEY` (your live_secret_key from Khalti dashboard)

### Step 2: Create Edge Function — `khalti-initiate`
- Accepts cart items, total amount, user ID
- Creates a pending order in the `orders` table with status `processing`
- Calls Khalti's `https://a.khalti.com/api/v2/epayment/initiate/` (or sandbox URL) with:
  - `return_url` pointing to your site's `/payment/verify` page
  - `website_url`, `amount` (in paisa), `purchase_order_id`, `purchase_order_name`
- Returns the Khalti `payment_url` for frontend redirect

### Step 3: Create Edge Function — `khalti-verify`
- Called when user returns from Khalti with `pidx` query param
- Calls Khalti's `https://a.khalti.com/api/v2/epayment/lookup/` to verify payment status
- If verified (`Completed`), updates order status to `processing` (confirmed)
- If failed, marks order as cancelled

### Step 4: Add `payment_status` and `payment_pidx` columns to orders table
- `payment_status` (text, default `'pending'`) — tracks Khalti payment state
- `payment_pidx` (text, nullable) — stores Khalti's payment identifier for lookup

### Step 5: Update CartPage
- Replace direct order creation with a call to `khalti-initiate` edge function
- Redirect user to Khalti's `payment_url`

### Step 6: Create Payment Verification Page (`/payment/verify`)
- Reads `pidx` from URL query params
- Calls `khalti-verify` edge function
- Shows success/failure and redirects to orders dashboard

### Step 7: Admin — add Khalti environment toggle
- Store a `khalti_environment` setting in `site_settings` (`sandbox` or `production`) so you can switch between test and live environments

## Files to Create/Modify
- `supabase/functions/khalti-initiate/index.ts` — new
- `supabase/functions/khalti-verify/index.ts` — new
- `src/pages/PaymentVerify.tsx` — new page
- `src/pages/CartPage.tsx` — update checkout flow
- `src/App.tsx` — add `/payment/verify` route
- Database migration — add payment columns to orders




## Plan: Revert Signup to Standard Email Confirmation

### Summary
Remove the OTP verification UI from the signup page and use Supabase's default email confirmation link system. After signup, show a message telling the user to check their email for a confirmation link.

### Changes

**File: `src/pages/Signup.tsx`**
- Remove all OTP-related state (`otpStep`, `otp`, `verifying`)
- Remove `handleVerifyOtp` and `handleResendOtp` functions
- Remove the OTP input UI (InputOTP components)
- After successful `supabase.auth.signUp`, show a toast message like "Please check your email to confirm your account" and redirect to `/login`
- Remove unused imports (`InputOTP`, `InputOTPGroup`, `InputOTPSlot`)

### Flow After Changes
1. User fills signup form → clicks Sign Up
2. Supabase sends a confirmation email with a link
3. User sees a success message and is redirected to `/login`
4. User clicks the link in their email → account is confirmed
5. User logs in → redirected to `/dashboard/orders`


CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'transactional',
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view email templates"
  ON public.email_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins manage email templates"
  ON public.email_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all 8 templates with their default field values
INSERT INTO public.email_templates (template_key, display_name, category, fields) VALUES
('new-order', 'New Order (App)', 'transactional', jsonb_build_object(
  'subject', 'Your Toolsmandu order has been received!',
  'eyebrow', 'ORDER CONFIRMATION',
  'heading', 'Thank you for your order',
  'sub_message', 'We''ve received your order and it''s being prepared. A separate email with your product details will follow shortly.',
  'support_title', 'Need help with your order?',
  'support_text', 'Our team is one tap away on WhatsApp.'
)),
('order-completed', 'Order Completed (App)', 'transactional', jsonb_build_object(
  'subject', 'Your Toolsmandu order is now completed!',
  'eyebrow', 'ORDER COMPLETED',
  'heading', 'Your order is ready',
  'sub_message', 'Thank you for your recent order with Toolsmandu.com! We''re delighted to inform you that your product is now ready for access.',
  'admin_message_header', 'Admin has sent you the following message',
  'reminder_text', 'For your reminder, here is your order details:',
  'support_title', 'Need help with your order?',
  'support_text', 'Our team is one tap away on WhatsApp.',
  'review_title', 'Loved your experience?',
  'review_text', 'A quick review really helps us out!'
)),
('signup', 'Signup Verification (Auth)', 'auth', jsonb_build_object(
  'subject', 'Your verification code',
  'heading', 'Confirm your email',
  'body', 'Use the code below to verify your email address.',
  'footer_note', 'If you did not request this, you can safely ignore this email.'
)),
('magiclink', 'Magic Link Login (Auth)', 'auth', jsonb_build_object(
  'subject', 'Your login link',
  'heading', 'Sign in to your account',
  'body', 'Click the button below to sign in. This link expires shortly.',
  'cta_label', 'Sign in',
  'footer_note', 'If you did not request this, you can safely ignore this email.'
)),
('recovery', 'Password Reset (Auth)', 'auth', jsonb_build_object(
  'subject', 'Your password reset code',
  'heading', 'Reset your password',
  'body', 'Use the code below to reset your password.',
  'footer_note', 'If you did not request a password reset, you can safely ignore this email.'
)),
('invite', 'Invitation (Auth)', 'auth', jsonb_build_object(
  'subject', 'You''ve been invited',
  'heading', 'You''re invited',
  'body', 'You have been invited to join. Click below to accept.',
  'cta_label', 'Accept invitation',
  'footer_note', ''
)),
('email_change', 'Email Change Confirmation (Auth)', 'auth', jsonb_build_object(
  'subject', 'Confirm your new email',
  'heading', 'Confirm your new email',
  'body', 'Click the button below to confirm your new email address.',
  'cta_label', 'Confirm email',
  'footer_note', 'If you did not request this change, you can safely ignore this email.'
)),
('reauthentication', 'Reauthentication Code (Auth)', 'auth', jsonb_build_object(
  'subject', 'Your verification code',
  'heading', 'Verify it''s you',
  'body', 'Use the code below to confirm this action.',
  'footer_note', ''
));
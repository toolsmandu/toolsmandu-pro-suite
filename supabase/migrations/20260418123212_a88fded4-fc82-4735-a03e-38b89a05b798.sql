UPDATE public.email_templates
SET fields = jsonb_build_object(
  'eyebrow', 'ORDER NOTE',
  'subject', 'You have a new note on your Toolsmandu order',
  'sub_message', 'You have a new note from Toolsmandu.com regarding your recent order.',
  'admin_message_header', 'Admin has sent you the following message',
  'reminder_text', 'For your reminder, here is your order details:',
  'support_title', 'Need help with your order?',
  'support_text', 'Our team is one tap away on WhatsApp.'
),
updated_at = now()
WHERE template_key = 'order-note';
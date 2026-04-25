
-- Track customer login events to compute monthly active customers
CREATE TABLE public.customer_logins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_logins_user_time ON public.customer_logins(user_id, logged_in_at);
CREATE INDEX idx_customer_logins_time ON public.customer_logins(logged_in_at);

ALTER TABLE public.customer_logins ENABLE ROW LEVEL SECURITY;

-- Users can record their own login
CREATE POLICY "Users can insert own login"
ON public.customer_logins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins/editors can view all logins
CREATE POLICY "Admins editors view logins"
ON public.customer_logins
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Users can view their own logins
CREATE POLICY "Users view own logins"
ON public.customer_logins
FOR SELECT
USING (auth.uid() = user_id);


-- 1. inbox_domains
CREATE TABLE public.inbox_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inbox_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active inbox domains"
  ON public.inbox_domains FOR SELECT
  USING (is_active = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

CREATE POLICY "Admins editors manage inbox domains"
  ON public.inbox_domains FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

CREATE TRIGGER trg_inbox_domains_updated
  BEFORE UPDATE ON public.inbox_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. inbox_addresses
CREATE TABLE public.inbox_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_part text NOT NULL,
  domain_id uuid NOT NULL REFERENCES public.inbox_domains(id) ON DELETE CASCADE,
  full_address text NOT NULL UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CONSTRAINT inbox_addresses_local_part_format CHECK (local_part ~ '^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$'),
  CONSTRAINT inbox_addresses_unique_per_domain UNIQUE (local_part, domain_id)
);
ALTER TABLE public.inbox_addresses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inbox_addresses_full ON public.inbox_addresses(full_address);
CREATE INDEX idx_inbox_addresses_expires ON public.inbox_addresses(expires_at);
CREATE INDEX idx_inbox_addresses_created_by ON public.inbox_addresses(created_by);

CREATE POLICY "Anyone can view inbox addresses"
  ON public.inbox_addresses FOR SELECT USING (true);

CREATE POLICY "Anyone can create inbox addresses"
  ON public.inbox_addresses FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins editors manage inbox addresses"
  ON public.inbox_addresses FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

-- 3. inbox_messages
CREATE TABLE public.inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_id uuid NOT NULL REFERENCES public.inbox_addresses(id) ON DELETE CASCADE,
  from_email text,
  from_name text,
  subject text,
  text_body text,
  html_body text,
  raw_size integer,
  received_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inbox_messages_address ON public.inbox_messages(address_id, received_at DESC);
CREATE INDEX idx_inbox_messages_expires ON public.inbox_messages(expires_at);

CREATE POLICY "Anyone can view inbox messages"
  ON public.inbox_messages FOR SELECT USING (true);

CREATE POLICY "Admins editors manage inbox messages"
  ON public.inbox_messages FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

-- 4. inbox_attachments
CREATE TABLE public.inbox_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.inbox_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text,
  size_bytes integer,
  storage_path text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inbox_attachments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inbox_attachments_msg ON public.inbox_attachments(message_id);
CREATE INDEX idx_inbox_attachments_expires ON public.inbox_attachments(expires_at);

CREATE POLICY "Anyone can view inbox attachments"
  ON public.inbox_attachments FOR SELECT USING (true);

CREATE POLICY "Admins editors manage inbox attachments"
  ON public.inbox_attachments FOR ALL
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

-- 5. Storage bucket for attachments (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inbox-attachments', 'inbox-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read inbox attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inbox-attachments');

CREATE POLICY "Admins editors manage inbox attachment files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'inbox-attachments' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')))
  WITH CHECK (bucket_id = 'inbox-attachments' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')));

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_messages;
ALTER TABLE public.inbox_messages REPLICA IDENTITY FULL;

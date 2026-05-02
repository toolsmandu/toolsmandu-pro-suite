-- Enable pgcrypto for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- =========================================
-- 1. IMAP Servers (admin-managed, password encrypted)
-- =========================================
CREATE TABLE public.inbox_imap_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL UNIQUE,
  host text NOT NULL,
  port integer NOT NULL DEFAULT 993,
  encryption text NOT NULL DEFAULT 'ssl',
  username text NOT NULL,
  password_encrypted bytea NOT NULL,
  validate_cert boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbox_imap_servers ENABLE ROW LEVEL SECURITY;

-- Admins can view metadata (NOT the password column directly via RPC only)
CREATE POLICY "Admins view imap servers"
ON public.inbox_imap_servers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete imap servers"
ON public.inbox_imap_servers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert/update only via SECURITY DEFINER functions (no direct insert/update)

CREATE TRIGGER update_inbox_imap_servers_updated_at
BEFORE UPDATE ON public.inbox_imap_servers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 2. Domains (admin-managed, manual entry)
-- =========================================
CREATE TABLE public.inbox_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  imap_server_id uuid NOT NULL REFERENCES public.inbox_imap_servers(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbox_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage domains"
ON public.inbox_domains FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active domains"
ON public.inbox_domains FOR SELECT
USING (is_active = true);

-- =========================================
-- 3. Inbox Addresses (created by users / public)
-- =========================================
CREATE TABLE public.inbox_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text NOT NULL,
  domain_id uuid NOT NULL REFERENCES public.inbox_domains(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX idx_inbox_addresses_user ON public.inbox_addresses(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_inbox_addresses_session ON public.inbox_addresses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_inbox_addresses_email ON public.inbox_addresses(email);

ALTER TABLE public.inbox_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all inbox addresses"
ON public.inbox_addresses FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own inbox addresses"
ON public.inbox_addresses FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users create own inbox addresses"
ON public.inbox_addresses FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users delete own inbox addresses"
ON public.inbox_addresses FOR DELETE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Public (anonymous) inbox creation handled by edge function via service role

-- =========================================
-- 4. Encryption helper functions
-- =========================================

-- Set/update IMAP server password (admin only)
CREATE OR REPLACE FUNCTION public.set_imap_server(
  _id uuid,
  _tag text,
  _host text,
  _port integer,
  _encryption text,
  _username text,
  _password text,
  _validate_cert boolean,
  _is_active boolean,
  _encryption_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can manage IMAP servers';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.inbox_imap_servers (tag, host, port, encryption, username, password_encrypted, validate_cert, is_active)
    VALUES (
      _tag, _host, _port, _encryption, _username,
      pgp_sym_encrypt(_password, _encryption_key),
      _validate_cert, _is_active
    )
    RETURNING id INTO result_id;
  ELSE
    UPDATE public.inbox_imap_servers
    SET tag = _tag,
        host = _host,
        port = _port,
        encryption = _encryption,
        username = _username,
        password_encrypted = CASE 
          WHEN _password IS NOT NULL AND _password <> '' 
          THEN pgp_sym_encrypt(_password, _encryption_key)
          ELSE password_encrypted 
        END,
        validate_cert = _validate_cert,
        is_active = _is_active,
        updated_at = now()
    WHERE id = _id
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$$;

-- Get decrypted IMAP server (service role / edge function only)
CREATE OR REPLACE FUNCTION public.get_imap_server_decrypted(
  _id uuid,
  _encryption_key text
)
RETURNS TABLE(
  id uuid,
  tag text,
  host text,
  port integer,
  encryption text,
  username text,
  password text,
  validate_cert boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only service role can decrypt IMAP credentials';
  END IF;

  RETURN QUERY
  SELECT 
    s.id, s.tag, s.host, s.port, s.encryption, s.username,
    pgp_sym_decrypt(s.password_encrypted, _encryption_key)::text AS password,
    s.validate_cert, s.is_active
  FROM public.inbox_imap_servers s
  WHERE s.id = _id;
END;
$$;
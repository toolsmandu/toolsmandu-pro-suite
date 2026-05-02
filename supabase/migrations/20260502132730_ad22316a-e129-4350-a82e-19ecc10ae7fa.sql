-- Drop the old function (it required passing the encryption key from the client)
DROP FUNCTION IF EXISTS public.set_imap_server(uuid, text, text, integer, text, text, text, boolean, boolean, text);

-- Service-role only: insert with encrypted password
CREATE OR REPLACE FUNCTION public.insert_imap_server_with_password(
  _tag text, _host text, _port integer, _encryption text,
  _username text, _password text, _validate_cert boolean, _is_active boolean,
  _encryption_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only service role can call this function';
  END IF;
  INSERT INTO public.inbox_imap_servers (tag, host, port, encryption, username, password_encrypted, validate_cert, is_active)
  VALUES (_tag, _host, _port, _encryption, _username,
          pgp_sym_encrypt(_password, _encryption_key),
          _validate_cert, _is_active)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Service-role only: update with re-encrypted password
CREATE OR REPLACE FUNCTION public.update_imap_server_with_password(
  _id uuid, _tag text, _host text, _port integer, _encryption text,
  _username text, _password text, _validate_cert boolean, _is_active boolean,
  _encryption_key text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only service role can call this function';
  END IF;
  UPDATE public.inbox_imap_servers
  SET tag = _tag, host = _host, port = _port, encryption = _encryption,
      username = _username,
      password_encrypted = pgp_sym_encrypt(_password, _encryption_key),
      validate_cert = _validate_cert, is_active = _is_active,
      updated_at = now()
  WHERE id = _id;
END;
$$;

-- Lock down EXECUTE
REVOKE ALL ON FUNCTION public.insert_imap_server_with_password(text, text, integer, text, text, text, boolean, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_imap_server_with_password(text, text, integer, text, text, text, boolean, boolean, text) TO service_role;

REVOKE ALL ON FUNCTION public.update_imap_server_with_password(uuid, text, text, integer, text, text, text, boolean, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_imap_server_with_password(uuid, text, text, integer, text, text, text, boolean, boolean, text) TO service_role;
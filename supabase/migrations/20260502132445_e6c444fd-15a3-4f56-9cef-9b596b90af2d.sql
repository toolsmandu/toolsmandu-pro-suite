-- Lock down EXECUTE on inbox SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.set_imap_server(uuid, text, text, integer, text, text, text, boolean, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_imap_server(uuid, text, text, integer, text, text, text, boolean, boolean, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_imap_server_decrypted(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_imap_server_decrypted(uuid, text) TO service_role;
CREATE OR REPLACE FUNCTION public.upsert_sheet_master_row(_sheet_id uuid, _group_index integer, _row_index integer, _account text, _password text, _expiry_date date, _remarks text, _encryption_key text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  IF auth.role() <> 'service_role' AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.sheet_master_rows (sheet_id, group_index, row_index, account, password_encrypted, expiry_date, remarks)
  VALUES (_sheet_id, _group_index, _row_index, _account,
          CASE WHEN _password IS NULL OR _password = '' THEN NULL ELSE pgp_sym_encrypt(_password, _encryption_key) END,
          _expiry_date, _remarks)
  ON CONFLICT (sheet_id, group_index, row_index) DO UPDATE
    SET account = EXCLUDED.account,
        password_encrypted = EXCLUDED.password_encrypted,
        expiry_date = EXCLUDED.expiry_date,
        remarks = EXCLUDED.remarks,
        updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_sheet_master_rows(_sheet_id uuid, _encryption_key text)
 RETURNS TABLE(id uuid, sheet_id uuid, group_index integer, row_index integer, account text, password text, expiry_date date, remarks text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT m.id, m.sheet_id, m.group_index, m.row_index, m.account,
         CASE WHEN m.password_encrypted IS NULL THEN NULL
              ELSE pgp_sym_decrypt(m.password_encrypted, _encryption_key)::text END AS password,
         m.expiry_date, m.remarks
  FROM public.sheet_master_rows m
  WHERE m.sheet_id = _sheet_id
  ORDER BY m.group_index, m.row_index;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_sheet_master_group(_sheet_id uuid, _group_index integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.sheet_master_rows WHERE sheet_id = _sheet_id AND group_index = _group_index;
END;
$function$;
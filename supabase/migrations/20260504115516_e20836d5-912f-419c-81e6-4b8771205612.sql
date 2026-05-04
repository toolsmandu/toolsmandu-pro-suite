-- Ensure pgcrypto is available for pgp_sym_encrypt/decrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Table to store encrypted master rows for sheets
CREATE TABLE public.sheet_master_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL,
  group_index integer NOT NULL,
  row_index integer NOT NULL,
  account text,
  password_encrypted bytea,
  expiry_date date,
  remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (sheet_id, group_index, row_index)
);

ALTER TABLE public.sheet_master_rows ENABLE ROW LEVEL SECURITY;

-- Only admins/editors can manage; password column is bytea (encrypted), never exposed plain via SELECT
CREATE POLICY "Admins editors manage sheet master rows"
ON public.sheet_master_rows
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_sheet_master_rows_updated_at
BEFORE UPDATE ON public.sheet_master_rows
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sheet_master_rows_sheet ON public.sheet_master_rows(sheet_id);

-- RPC: list master rows for a sheet WITH decrypted password
CREATE OR REPLACE FUNCTION public.list_sheet_master_rows(_sheet_id uuid, _encryption_key text)
RETURNS TABLE (
  id uuid,
  sheet_id uuid,
  group_index integer,
  row_index integer,
  account text,
  password text,
  expiry_date date,
  remarks text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)) THEN
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
$$;

-- RPC: upsert a single master row with encrypted password
CREATE OR REPLACE FUNCTION public.upsert_sheet_master_row(
  _sheet_id uuid,
  _group_index integer,
  _row_index integer,
  _account text,
  _password text,
  _expiry_date date,
  _remarks text,
  _encryption_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)) THEN
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
$$;

-- RPC: delete master rows for a group
CREATE OR REPLACE FUNCTION public.delete_sheet_master_group(_sheet_id uuid, _group_index integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.sheet_master_rows WHERE sheet_id = _sheet_id AND group_index = _group_index;
END;
$$;
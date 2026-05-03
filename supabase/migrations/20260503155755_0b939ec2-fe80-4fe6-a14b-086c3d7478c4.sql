CREATE TABLE public.sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  rows_count integer NOT NULL DEFAULT 50,
  cols_count integer NOT NULL DEFAULT 26,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage sheets"
ON public.sheets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_sheets_updated_at
BEFORE UPDATE ON public.sheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
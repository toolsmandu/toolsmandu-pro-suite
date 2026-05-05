ALTER TABLE public.sheets
ADD COLUMN IF NOT EXISTS master_row_count integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS normal_row_count integer NOT NULL DEFAULT 4;

-- Add slug column to sheets table
ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS slug TEXT;

-- Slugify function
CREATE OR REPLACE FUNCTION public.slugify_sheet_name(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s TEXT;
BEGIN
  s := lower(coalesce(input, ''));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  IF s = '' THEN s := 'sheet'; END IF;
  RETURN s;
END;
$$;

-- Trigger to auto-fill slug, ensuring uniqueness
CREATE OR REPLACE FUNCTION public.sheets_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  i INT := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name AND (OLD.slug IS NULL OR OLD.slug = public.slugify_sheet_name(OLD.name))) THEN
    base := public.slugify_sheet_name(NEW.name);
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.sheets WHERE slug = candidate AND id <> NEW.id) LOOP
      i := i + 1;
      candidate := base || '-' || i;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sheets_set_slug_trigger ON public.sheets;
CREATE TRIGGER sheets_set_slug_trigger
BEFORE INSERT OR UPDATE ON public.sheets
FOR EACH ROW
EXECUTE FUNCTION public.sheets_set_slug();

-- Backfill existing rows
UPDATE public.sheets SET slug = NULL WHERE slug IS NULL;
UPDATE public.sheets SET name = name WHERE slug IS NULL OR slug = '';

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS sheets_slug_unique_idx ON public.sheets(slug);

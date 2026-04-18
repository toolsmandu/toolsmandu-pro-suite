ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill: assume past completed orders were completed at updated_at
UPDATE public.orders
   SET completed_at = updated_at
 WHERE status = 'completed' AND completed_at IS NULL;

-- Trigger: set/clear completed_at when status transitions
CREATE OR REPLACE FUNCTION public.set_order_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    ELSIF NEW.status <> 'completed' AND OLD.status = 'completed' THEN
      NEW.completed_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_set_completed_at ON public.orders;
CREATE TRIGGER trg_orders_set_completed_at
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_completed_at();
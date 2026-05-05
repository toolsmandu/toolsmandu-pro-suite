CREATE OR REPLACE FUNCTION public.append_completed_order_to_sheets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oi RECORD;
  sheet_link RECORD;
  v_email text;
  v_phone text;
  v_period text;
  v_remarks text;
  v_purchase_date text;
  v_new_row jsonb;
BEGIN
  IF NOT (
    (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
    OR (TG_OP = 'INSERT' AND NEW.status = 'completed')
  ) THEN
    RETURN NEW;
  END IF;

  v_purchase_date := to_char(COALESCE(NEW.completed_at, now()), 'YYYY-MM-DD');

  FOR oi IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
    IF oi.variation_id IS NULL THEN CONTINUE; END IF;

    FOR sheet_link IN
      SELECT sheet_id FROM public.sheet_variant_links WHERE variation_id = oi.variation_id
    LOOP
      v_email := NULL;
      IF oi.input_field_responses IS NOT NULL THEN
        SELECT (elem->>'value') INTO v_email
        FROM jsonb_array_elements(oi.input_field_responses) elem
        WHERE lower(coalesce(elem->>'field_type','')) = 'email'
          AND coalesce(elem->>'value','') <> ''
        LIMIT 1;
      END IF;
      IF v_email IS NULL OR v_email = '' THEN
        SELECT email INTO v_email FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
      END IF;

      SELECT phone INTO v_phone FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

      SELECT COALESCE(expiry_days::text, '') INTO v_period
      FROM public.product_variations WHERE id = oi.variation_id;

      v_remarks := NULL;
      IF oi.input_field_responses IS NOT NULL THEN
        SELECT string_agg(
                 COALESCE(elem->>'label', elem->>'field_name', 'Field') || ': ' || COALESCE(elem->>'value',''),
                 ', '
               )
        INTO v_remarks
        FROM jsonb_array_elements(oi.input_field_responses) elem
        WHERE lower(coalesce(elem->>'field_type','')) <> 'email'
          AND coalesce(elem->>'value','') <> '';
      END IF;

      v_new_row := jsonb_build_object(
        'id', gen_random_uuid()::text,
        'orderId', NEW.order_number,
        'purchaseDate', v_purchase_date,
        'email', COALESCE(v_email, ''),
        'phone', COALESCE(v_phone, ''),
        'period', COALESCE(v_period, ''),
        'remaining', '',
        'remarks', COALESCE(v_remarks, '')
      );

      UPDATE public.sheets
      SET data = COALESCE(data, '[]'::jsonb) || jsonb_build_array(v_new_row),
          updated_at = now()
      WHERE id = sheet_link.sheet_id;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_append_to_sheets_on_complete ON public.orders;
CREATE TRIGGER orders_append_to_sheets_on_complete
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.append_completed_order_to_sheets();
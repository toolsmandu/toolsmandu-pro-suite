CREATE OR REPLACE FUNCTION public.append_completed_order_to_sheets()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  oi RECORD;
  sheet_link RECORD;
  v_sheet RECORD;
  v_email text;
  v_phone text;
  v_period text;
  v_remarks text;
  v_purchase_date text;
  v_data jsonb;
  v_new_data jsonb;
  v_elem jsonb;
  v_idx int;
  v_filled boolean;
  v_has_master boolean;
  v_normal_count int;
  v_total_normal int;
  v_last_group_start int;
  v_normal_seen int;
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
      SELECT id, name, kind, master_row_count, normal_row_count, COALESCE(data, '[]'::jsonb) AS data
      INTO v_sheet
      FROM public.sheets WHERE id = sheet_link.sheet_id;

      IF v_sheet.id IS NULL THEN CONTINUE; END IF;

      v_has_master := COALESCE(v_sheet.master_row_count, 0) > 0;

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

      v_data := v_sheet.data;
      v_filled := false;

      IF v_has_master THEN
        v_normal_count := GREATEST(COALESCE(v_sheet.normal_row_count, 1), 1);

        -- Count total normal rows in data
        SELECT COUNT(*) INTO v_total_normal
        FROM jsonb_array_elements(v_data) elem
        WHERE COALESCE(elem->>'kind','normal') = 'normal';

        IF v_total_normal < v_normal_count THEN
          -- No groups exist yet (or fewer than one full group's worth) — block
          RAISE EXCEPTION 'Family Sheet Limit is Full for "%". Please manage a new account to create new order.', v_sheet.name
            USING ERRCODE = 'P0001';
        END IF;

        -- Index (within the normal-only sequence) where the LAST group starts
        v_last_group_start := ((v_total_normal - 1) / v_normal_count) * v_normal_count;

        -- Fill the first empty slot only within the last group
        v_new_data := '[]'::jsonb;
        v_normal_seen := 0;
        FOR v_idx IN 0 .. (jsonb_array_length(v_data) - 1) LOOP
          v_elem := v_data -> v_idx;
          IF COALESCE(v_elem->>'kind','normal') = 'normal' THEN
            IF NOT v_filled
               AND v_normal_seen >= v_last_group_start
               AND COALESCE(v_elem->>'orderId','') = '' THEN
              v_elem := jsonb_set(v_elem, '{orderId}', to_jsonb(NEW.order_number));
              v_elem := jsonb_set(v_elem, '{purchaseDate}', to_jsonb(v_purchase_date));
              v_elem := jsonb_set(v_elem, '{email}', to_jsonb(COALESCE(v_email,'')));
              v_elem := jsonb_set(v_elem, '{phone}', to_jsonb(COALESCE(v_phone,'')));
              v_elem := jsonb_set(v_elem, '{period}', to_jsonb(COALESCE(v_period,'')));
              v_elem := jsonb_set(v_elem, '{remarks}', to_jsonb(COALESCE(v_remarks,'')));
              v_filled := true;
            END IF;
            v_normal_seen := v_normal_seen + 1;
          END IF;
          v_new_data := v_new_data || jsonb_build_array(v_elem);
        END LOOP;

        IF NOT v_filled THEN
          RAISE EXCEPTION 'Family Sheet Limit is Full for "%". Please manage a new account to create new order.', v_sheet.name
            USING ERRCODE = 'P0001';
        END IF;

        UPDATE public.sheets
        SET data = v_new_data, updated_at = now()
        WHERE id = v_sheet.id;
      ELSE
        -- Simple sheet: just append
        UPDATE public.sheets
        SET data = COALESCE(data, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
              'id', gen_random_uuid()::text,
              'orderId', NEW.order_number,
              'purchaseDate', v_purchase_date,
              'email', COALESCE(v_email,''),
              'phone', COALESCE(v_phone,''),
              'period', COALESCE(v_period,''),
              'remaining', '',
              'remarks', COALESCE(v_remarks,'')
            )),
            updated_at = now()
        WHERE id = v_sheet.id;
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_row RECORD;
  cleanup_count integer := 0;
BEGIN
  FOR expired_row IN
    SELECT ca.id, ca.credential_id
    FROM credential_assignments ca
    WHERE ca.validity_days IS NOT NULL
      AND ca.assigned_at + (ca.validity_days || ' days')::interval <= now()
  LOOP
    -- Decrement assigned_count
    UPDATE family_sharing_credentials
    SET assigned_count = GREATEST(0, assigned_count - 1)
    WHERE id = expired_row.credential_id;

    -- Delete the expired assignment
    DELETE FROM credential_assignments WHERE id = expired_row.id;

    cleanup_count := cleanup_count + 1;
  END LOOP;

  RETURN cleanup_count;
END;
$$;

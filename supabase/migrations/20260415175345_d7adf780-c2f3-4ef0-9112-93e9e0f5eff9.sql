
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

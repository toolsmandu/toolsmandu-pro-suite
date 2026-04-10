
ALTER TABLE public.profiles ADD COLUMN is_suspended boolean NOT NULL DEFAULT false;

-- Allow editors to also view all profiles
CREATE POLICY "Editors can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'editor'::app_role));

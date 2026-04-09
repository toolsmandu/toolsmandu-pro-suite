DROP POLICY "Users can view assigned credentials" ON public.family_sharing_credentials;

CREATE POLICY "Users can view assigned credentials"
ON public.family_sharing_credentials
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM credential_assignments ca
    WHERE ca.credential_id = family_sharing_credentials.id
      AND ca.user_id = auth.uid()
  )
);
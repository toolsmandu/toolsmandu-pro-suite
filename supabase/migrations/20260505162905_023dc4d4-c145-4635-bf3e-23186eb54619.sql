ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sheet-images', 'sheet-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sheet images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'sheet-images');

CREATE POLICY "Admins editors upload sheet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sheet-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));

CREATE POLICY "Admins editors update sheet images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sheet-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));

CREATE POLICY "Admins editors delete sheet images"
ON storage.objects FOR DELETE
USING (bucket_id = 'sheet-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));
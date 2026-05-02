
ALTER PUBLICATION supabase_realtime DROP TABLE public.inbox_messages;

DROP TABLE IF EXISTS public.inbox_attachments CASCADE;
DROP TABLE IF EXISTS public.inbox_messages CASCADE;
DROP TABLE IF EXISTS public.inbox_addresses CASCADE;
DROP TABLE IF EXISTS public.inbox_domains CASCADE;

DROP POLICY IF EXISTS "Public can read inbox attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins editors manage inbox attachment files" ON storage.objects;

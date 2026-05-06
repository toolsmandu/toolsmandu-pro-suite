CREATE TABLE public.free_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  tool_info TEXT,
  tool_description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.free_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active free tools"
  ON public.free_tools FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins editors manage free tools"
  ON public.free_tools FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_free_tools_updated_at
  BEFORE UPDATE ON public.free_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE public.chatbot_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chatbot qa"
ON public.chatbot_qa FOR SELECT
USING (true);

CREATE POLICY "Admins editors manage chatbot qa"
ON public.chatbot_qa FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_chatbot_qa_updated_at
BEFORE UPDATE ON public.chatbot_qa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chatbot_qa_product ON public.chatbot_qa(product_id, sort_order);
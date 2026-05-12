import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

const AdobeFAQs = ({ productName }: { productName: string }) => {
  const { data: faqs } = useQuery({
    queryKey: ['adobe-template-faqs'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('faqs').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  if (!faqs?.length) return null;

  const replace = (t: string) => t.replace(/\[product\]/gi, productName);

  return (
    <section className="py-8 md:py-12" style={{ backgroundColor: '#0a1f3d' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-foreground mb-5">
          Frequently Asked Questions
        </h2>
        <Card className="overflow-hidden border-border/50" style={{ backgroundColor: 'rgba(10, 46, 92, 0.5)' }}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-border/40 px-6 last:border-b-0">
                <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:no-underline text-left [&>span]:text-left">
                  <span className="flex-1 text-left">{replace(faq.question)}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm text-muted-foreground leading-relaxed">
                  {replace(faq.answer)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </section>
  );
};

export default AdobeFAQs;

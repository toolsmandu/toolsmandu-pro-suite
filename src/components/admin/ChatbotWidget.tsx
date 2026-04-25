import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MessageCircle, X, ChevronsUpDown, Check, ArrowLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QA {
  id: string;
  question: string;
  answer: string;
}

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeQA, setActiveQA] = useState<QA | null>(null);

  const { data: products } = useQuery({
    queryKey: ['chatbot-widget-products'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, name').order('name');
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: qas } = useQuery({
    queryKey: ['chatbot-widget-qa', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_qa')
        .select('id, question, answer')
        .eq('product_id', productId)
        .order('sort_order');
      if (error) throw error;
      return data as QA[];
    },
  });

  const reset = () => {
    setProductId('');
    setProductName('');
    setActiveQA(null);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-3rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Chatbot</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chatbot" className="hover:opacity-80">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-3 border-b border-border">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className={cn('w-full justify-between', !productId && 'text-muted-foreground')}>
                  {productName || 'Select a product'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search product..." />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                      {products?.map(p => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            setProductId(p.id);
                            setProductName(p.name);
                            setActiveQA(null);
                            setPickerOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', productId === p.id ? 'opacity-100' : 'opacity-0')} />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {!productId ? (
              <p className="text-sm text-muted-foreground text-center mt-8">
                Select a product to see questions.
              </p>
            ) : activeQA ? (
              <div className="space-y-3">
                <button
                  onClick={() => setActiveQA(null)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to questions
                </button>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-semibold text-sm text-foreground mb-2">{activeQA.question}</p>
                  <div
                    className="text-sm text-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: activeQA.answer }}
                  />
                </div>
                {qas && qas.filter(q => q.id !== activeQA.id).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Other Questions:</p>
                    {qas.filter(q => q.id !== activeQA.id).map(qa => (
                      <button
                        key={qa.id}
                        onClick={() => setActiveQA(qa)}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        {qa.question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : !qas?.length ? (
              <p className="text-sm text-muted-foreground text-center mt-8">
                No questions for this product yet.
              </p>
            ) : (
              <div className="space-y-2">
                {qas.map(qa => (
                  <button
                    key={qa.id}
                    onClick={() => setActiveQA(qa)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    {qa.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <Button variant="outline" size="sm" className="w-full" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset Chat
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;

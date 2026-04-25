import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Pencil, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface QA {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface Draft {
  id?: string;
  question: string;
  answer: string;
}

const ProductCombobox = ({ products, value, onChange }: { products: { id: string; name: string }[]; value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const selected = products.find(p => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn('w-full justify-between', !selected && 'text-muted-foreground')}>
          {selected ? selected.name : 'Select a product'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map(p => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => { onChange(p.id); setOpen(false); }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === p.id ? 'opacity-100' : 'opacity-0')} />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const AdminChatbot = () => {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState<string>('');
  const [drafts, setDrafts] = useState<Draft[]>([{ question: '', answer: '' }]);

  const { data: products } = useQuery({
    queryKey: ['admin-chatbot-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, name').order('name');
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: qas, isLoading } = useQuery({
    queryKey: ['admin-chatbot-qa', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_qa')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');
      if (error) throw error;
      return data as QA[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (draft: Draft) => {
      if (!productId) throw new Error('Select a product first');
      if (!draft.question.trim() || !draft.answer.trim()) throw new Error('Question and answer required');
      if (draft.id) {
        const { error } = await supabase
          .from('chatbot_qa')
          .update({ question: draft.question, answer: draft.answer })
          .eq('id', draft.id);
        if (error) throw error;
      } else {
        const maxOrder = qas?.length ? Math.max(...qas.map(q => q.sort_order)) + 1 : 0;
        const { error } = await supabase.from('chatbot_qa').insert({
          product_id: productId,
          question: draft.question,
          answer: draft.answer,
          sort_order: maxOrder,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, draft) => {
      queryClient.invalidateQueries({ queryKey: ['admin-chatbot-qa', productId] });
      toast.success(draft.id ? 'Q&A updated' : 'Q&A added');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chatbot_qa').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chatbot-qa', productId] });
      toast.success('Q&A deleted');
    },
  });

  const updateDraft = (idx: number, patch: Partial<Draft>) => {
    setDrafts(prev => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const addDraft = () => setDrafts(prev => [...prev, { question: '', answer: '' }]);

  const removeDraft = (idx: number) =>
    setDrafts(prev => (prev.length === 1 ? [{ question: '', answer: '' }] : prev.filter((_, i) => i !== idx)));

  const saveDraft = async (idx: number) => {
    const draft = drafts[idx];
    await saveMutation.mutateAsync(draft);
    if (!draft.id) {
      // clear after creating a brand new one
      updateDraft(idx, { question: '', answer: '' });
    }
  };

  const startEdit = (qa: QA) => {
    setDrafts([{ id: qa.id, question: qa.question, answer: qa.answer }]);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Chatbot</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add questions and answers a chatbot can use for a specific product.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start">
        <Card className="p-4 w-full lg:w-80 lg:flex-shrink-0">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Product</label>
          <ProductCombobox products={products || []} value={productId} onChange={setProductId} />
        </Card>

        {productId && (
          <div className="flex-1 min-w-0 w-full space-y-4">
            {drafts.map((draft, idx) => (
              <Card key={idx} className="p-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Question</label>
                  <Input
                    value={draft.question}
                    onChange={e => updateDraft(idx, { question: e.target.value })}
                    placeholder="Type a question"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Answer</label>
                  <RichTextEditor
                    value={draft.answer}
                    onChange={v => updateDraft(idx, { answer: v })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveDraft(idx)} disabled={saveMutation.isPending}>
                    {draft.id ? 'Update Q&A' : 'Save Q&A'}
                  </Button>
                  {drafts.length > 1 && (
                    <Button variant="outline" onClick={() => removeDraft(idx)}>
                      Remove
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {productId && (
        <>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Existing Q&A</h3>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : !qas?.length ? (
              <Card className="p-6 text-center text-muted-foreground">No Q&A yet for this product.</Card>
            ) : (
              <div className="space-y-3">
                {qas.map(qa => (
                  <Card key={qa.id} className="p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm">{qa.question}</h4>
                      <div
                        className="text-sm text-muted-foreground mt-1 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: qa.answer }}
                      />
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => startEdit(qa)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(qa.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminChatbot;

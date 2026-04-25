import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

      <Card className="p-4 mb-6 max-w-md">
        <label className="text-sm font-medium text-foreground mb-1.5 block">Product</label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products?.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {productId && (
        <>
          <div className="space-y-4 mb-8">
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
            <Button variant="outline" onClick={addDraft}>
              <Plus className="h-4 w-4 mr-2" /> Add another Q&A
            </Button>
          </div>

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

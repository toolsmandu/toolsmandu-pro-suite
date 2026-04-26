import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, GripVertical, X } from 'lucide-react';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const AdminFAQs = () => {
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('faqs').select('*').order('sort_order');
      if (error) throw error;
      return data as FAQ[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from('faqs').update({ question, answer, is_active: isActive }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const maxOrder = faqs?.length ? Math.max(...faqs.map(f => f.sort_order)) + 1 : 0;
        const { error } = await supabase.from('faqs').insert({ question, answer, is_active: isActive, sort_order: maxOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success(editing ? 'FAQ updated' : 'FAQ created');
      closePanel();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ deleted');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setIsActive(true);
    setPanelOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditing(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsActive(faq.is_active);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">FAQs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs">[product]</code> in questions/answers to show the product name on the frontend.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add FAQ
        </Button>
      </div>

      <div className={`flex gap-6 ${panelOpen ? 'lg:flex-row-reverse' : ''}`}>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !faqs?.length ? (
            <Card className="p-8 text-center text-muted-foreground">No FAQs yet. Click "Add FAQ" to create one.</Card>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <Card key={faq.id} className="p-4 flex items-start gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{faq.question}</h3>
                      {!faq.is_active && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(faq)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(faq.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {panelOpen && (
          <div className="flex-1 border border-border rounded-lg bg-card p-6 self-start">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{editing ? 'Edit FAQ' : 'Add FAQ'}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closePanel}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Question</label>
                <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. What is [product]?" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Answer</label>
                <Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6} placeholder="Write the answer here. Use [product] for product name." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-foreground">Active</span>
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!question.trim() || !answer.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update FAQ' : 'Create FAQ'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFAQs;

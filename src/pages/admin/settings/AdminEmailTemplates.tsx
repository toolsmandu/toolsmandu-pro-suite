import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, ChevronRight, ArrowLeft } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';

// Field metadata: which fields per template should use rich-text editor vs plain input
const RICH_TEXT_FIELDS = new Set(['body', 'footer_note']);
const TEXTAREA_FIELDS = new Set(['sub_message', 'support_text', 'review_text']);

const FIELD_LABELS: Record<string, string> = {
  subject: 'Subject Line',
  eyebrow: 'Eyebrow Text (small label above heading)',
  heading: 'Heading',
  sub_message: 'Sub Message (below heading)',
  body: 'Body',
  cta_label: 'Button Label',
  footer_note: 'Footer Note',
  admin_message_header: 'Admin Message Header',
  reminder_text: 'Reminder Text',
  support_title: 'Support Title',
  support_text: 'Support Text',
  review_title: 'Review Section Title',
  review_text: 'Review Section Text',
};

const FIELD_HELP: Record<string, string> = {
  subject: 'The email subject line shown in the inbox.',
  eyebrow: 'Small uppercase label above the main heading.',
  body: 'Main body content. Supports rich text formatting.',
  footer_note: 'Small text shown at the bottom of the email.',
};

const AdminEmailTemplates = () => {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });
      return data || [];
    },
  });

  const selected = templates?.find((t) => t.template_key === selectedKey);

  const handleSelect = (key: string) => {
    const tmpl = templates?.find((t) => t.template_key === key);
    if (!tmpl) return;
    setSelectedKey(key);
    setEditFields({ ...(tmpl.fields as Record<string, string>) });
  };

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!selectedKey) return;
      const { error } = await supabase
        .from('email_templates')
        .update({ fields: editFields })
        .eq('template_key', selectedKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template saved!');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading templates...</div>;
  }

  // List view
  if (!selected) {
    const transactional = templates?.filter((t) => t.category === 'transactional') || [];
    const auth = templates?.filter((t) => t.category === 'auth') || [];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Email Templates
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Edit the subject lines and text content of your emails. Layout, colors, and dynamic data (order details, customer info) are kept consistent in code.
            </p>
          </CardHeader>
        </Card>

        {transactional.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">App Emails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {transactional.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.template_key)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-foreground">{t.display_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Subject: {(t.fields as any)?.subject || '—'}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {auth.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auth Emails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {auth.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.template_key)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-foreground">{t.display_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Subject: {(t.fields as any)?.subject || '—'}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Detail / edit view
  const fieldKeys = Object.keys(editFields);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedKey(null); setEditFields({}); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to all templates
        </Button>
        <Badge variant="outline">{selected.category}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> {selected.display_name}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Template key: <code className="text-xs">{selected.template_key}</code></p>
        </CardHeader>
        <CardContent className="space-y-5">
          {fieldKeys.map((key) => {
            const label = FIELD_LABELS[key] || key;
            const help = FIELD_HELP[key];
            const value = editFields[key] || '';
            const onChange = (v: string) => setEditFields({ ...editFields, [key]: v });

            return (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{label}</Label>
                {help && <p className="text-xs text-muted-foreground -mt-1">{help}</p>}
                {RICH_TEXT_FIELDS.has(key) ? (
                  <RichTextEditor value={value} onChange={onChange} />
                ) : TEXTAREA_FIELDS.has(key) ? (
                  <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
                ) : (
                  <Input value={value} onChange={(e) => onChange(e.target.value)} />
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>
              {saveTemplate.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditFields({ ...(selected.fields as Record<string, string>) })}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailTemplates;

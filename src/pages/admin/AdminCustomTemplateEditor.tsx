import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import TemplateSectionsEditor, { buildEmptySections, SectionType } from '@/components/admin/TemplateSectionsEditor';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

const AdminCustomTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [templateType, setTemplateType] = useState('adobe_style');
  const [sections, setSections] = useState<Record<SectionType, any>>(buildEmptySections());
  const [saving, setSaving] = useState(false);

  const { data: template } = useQuery({
    queryKey: ['admin-custom-template', id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_templates').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setSlug(template.slug || '');
      setTemplateType(template.template_type || 'adobe_style');
      const data = (template.data || {}) as any;
      const empty = buildEmptySections();
      setSections({
        hero: { ...empty.hero, ...(data.hero || {}) },
        app_grid: { ...empty.app_grid, ...(data.app_grid || {}) },
        features: { ...empty.features, ...(data.features || {}) },
        plans: { ...empty.plans, ...(data.plans || {}) },
      });
    }
  }, [template]);

  const save = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const finalSlug = slug.trim() || slugify(name);
      const payload = { name: name.trim(), slug: finalSlug, template_type: templateType, data: sections, is_active: true };

      if (isNew) {
        const { data, error } = await supabase.from('custom_templates').insert(payload).select('id').single();
        if (error) throw error;
        toast.success('Template created');
        queryClient.invalidateQueries({ queryKey: ['admin-custom-templates'] });
        navigate(`/admin/layout-section/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase.from('custom_templates').update(payload).eq('id', id!);
        if (error) throw error;
        toast.success('Template saved');
        queryClient.invalidateQueries({ queryKey: ['admin-custom-templates'] });
        queryClient.invalidateQueries({ queryKey: ['admin-custom-template', id] });
      }
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/layout-section"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isNew ? 'New custom template' : 'Edit custom template'}</h1>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adobe style v1" />
          </div>
          <div>
            <Label className="mb-1 block">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated from name" />
          </div>
        </div>
        <div>
          <Label className="mb-1 block">Template type</Label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="adobe_style">Adobe style</option>
          </select>
        </div>
      </div>

      <TemplateSectionsEditor value={sections} onChange={setSections} />
    </div>
  );
};

export default AdminCustomTemplateEditor;

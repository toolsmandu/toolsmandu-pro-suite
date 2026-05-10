import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { SingleSectionEditor, buildEmptySection, SECTION_TYPES, SECTION_LABELS, SectionType } from '@/components/admin/TemplateSectionsEditor';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

const AdminCustomTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sectionType, setSectionType] = useState<SectionType>('hero');
  const [data, setData] = useState<any>(buildEmptySection('hero'));
  const [saving, setSaving] = useState(false);

  const { data: row } = useQuery({
    queryKey: ['admin-layout-section', id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_templates').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (row) {
      setName(row.name || '');
      setSlug(row.slug || '');
      const t = (SECTION_TYPES.includes(row.template_type as SectionType) ? row.template_type : 'hero') as SectionType;
      setSectionType(t);
      setData({ ...buildEmptySection(t), ...((row.data as any) || {}) });
    }
  }, [row]);

  const onTypeChange = (t: SectionType) => {
    setSectionType(t);
    setData(buildEmptySection(t));
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const finalSlug = slug.trim() || slugify(name);
      const payload = { name: name.trim(), slug: finalSlug, template_type: sectionType, data, is_active: true };

      if (isNew) {
        const { data: ins, error } = await supabase.from('custom_templates').insert(payload).select('id').single();
        if (error) throw error;
        toast.success('Section created');
        queryClient.invalidateQueries({ queryKey: ['admin-layout-sections'] });
        navigate(`/admin/layout-section/${ins.id}`, { replace: true });
      } else {
        const { error } = await supabase.from('custom_templates').update(payload).eq('id', id!);
        if (error) throw error;
        toast.success('Section saved');
        queryClient.invalidateQueries({ queryKey: ['admin-layout-sections'] });
        queryClient.invalidateQueries({ queryKey: ['admin-layout-section', id] });
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
            <h1 className="text-2xl font-bold text-foreground">{isNew ? 'New section' : 'Edit section'}</h1>
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adobe hero v1" />
          </div>
          <div>
            <Label className="mb-1 block">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated from name" />
          </div>
        </div>
        <div>
          <Label className="mb-1 block">Section type</Label>
          <select
            value={sectionType}
            onChange={(e) => onTypeChange(e.target.value as SectionType)}
            disabled={!isNew}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
          >
            {SECTION_TYPES.map((t) => (
              <option key={t} value={t}>{SECTION_LABELS[t]}</option>
            ))}
          </select>
          {!isNew && <p className="text-xs text-muted-foreground mt-1">Section type can't be changed after creation.</p>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-base font-semibold mb-3">{SECTION_LABELS[sectionType]} content</h2>
        <SingleSectionEditor type={sectionType} value={data} onChange={setData} />
      </div>
    </div>
  );
};

export default AdminCustomTemplateEditor;

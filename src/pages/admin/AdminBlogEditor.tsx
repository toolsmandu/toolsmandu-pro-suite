import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const AdminBlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === 'new';
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    category_id: '' as string,
    content: '',
    cover_image_url: '',
    author_name: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_published: false,
    show_on_homepage: false,
    sort_order: 0,
  });
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_categories').select('*').order('sort_order').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: blog, isLoading } = useQuery({
    queryKey: ['admin-blog', id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (blog) {
      setForm({
        title: blog.title || '',
        slug: blog.slug || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        cover_image_url: blog.cover_image_url || '',
        author_name: blog.author_name || '',
        meta_title: blog.meta_title || '',
        meta_description: blog.meta_description || '',
        meta_keywords: blog.meta_keywords || '',
        is_published: blog.is_published,
        show_on_homepage: blog.show_on_homepage,
        sort_order: blog.sort_order || 0,
      });
      setSlugTouched(true);
    }
  }, [blog]);

  const onTitleChange = (title: string) => {
    setForm(f => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
      meta_title: f.meta_title || title,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.slug.trim()) return toast.error('Slug is required');

    setSaving(true);
    const payload = {
      ...form,
      slug: slugify(form.slug),
      published_at: form.is_published && !blog?.published_at ? new Date().toISOString() : blog?.published_at,
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from('blogs').insert(payload));
    } else {
      ({ error } = await supabase.from('blogs').update(payload).eq('id', id));
    }
    setSaving(false);

    if (error) return toast.error(error.message);
    toast.success(isNew ? 'Blog post created' : 'Blog post saved');
    qc.invalidateQueries({ queryKey: ['admin-blogs'] });
    qc.invalidateQueries({ queryKey: ['homepage-blogs'] });
    qc.invalidateQueries({ queryKey: ['admin-blog', id] });
    if (isNew) navigate('/admin/blogs');
  };

  if (!isNew && isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const metaDescLen = form.meta_description.length;
  const metaTitleLen = form.meta_title.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/blogs"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">{isNew ? 'New Blog Post' : 'Edit Blog Post'}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={e => onTitleChange(e.target.value)} placeholder="Awesome blog post title" />
            </div>
            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input id="slug" value={form.slug} onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }} placeholder="my-blog-post" />
            </div>
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Short summary shown in cards and previews" rows={2} />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <Label>Content</Label>
            <RichTextEditor value={form.content} onChange={content => setForm(f => ({ ...f, content }))} />
          </Card>

          <Card className="p-4">
            <Tabs defaultValue="seo">
              <TabsList>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>
              <TabsContent value="seo" className="space-y-4 pt-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mt">Meta Title</Label>
                    <span className={`text-xs ${metaTitleLen > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>{metaTitleLen}/60</span>
                  </div>
                  <Input id="mt" value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="SEO title (defaults to post title)" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="md">Meta Description</Label>
                    <span className={`text-xs ${metaDescLen > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>{metaDescLen}/160</span>
                  </div>
                  <Textarea id="md" value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Description shown in search results" rows={3} />
                </div>
                <div>
                  <Label htmlFor="mk">Meta Keywords</Label>
                  <Input id="mk" value={form.meta_keywords} onChange={e => setForm(f => ({ ...f, meta_keywords: e.target.value }))} placeholder="comma, separated, keywords" />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Publish</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="pub" className="cursor-pointer">Published</Label>
              <Switch id="pub" checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="home" className="cursor-pointer">Show on Homepage Featured</Label>
              <Switch id="home" checked={form.show_on_homepage} onCheckedChange={v => setForm(f => ({ ...f, show_on_homepage: v }))} />
            </div>
            <div>
              <Label htmlFor="so">Sort Order</Label>
              <Input id="so" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="auth">Author Name</Label>
              <Input id="auth" value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} placeholder="Optional" />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="font-semibold">Cover Image</h3>
            <ImageUpload value={form.cover_image_url} onChange={url => setForm(f => ({ ...f, cover_image_url: url }))} label="" />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogEditor;

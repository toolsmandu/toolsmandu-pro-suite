import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye, Search, Star, Tag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const AdminBlogs = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [editingCat, setEditingCat] = useState<{ id: string; name: string; slug: string } | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_categories').select('*').order('sort_order').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blogs').select('*, blog_categories(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('blogs').delete().eq('id', deleteId);
    if (error) return toast.error(error.message);
    toast.success('Blog post deleted');
    qc.invalidateQueries({ queryKey: ['admin-blogs'] });
    qc.invalidateQueries({ queryKey: ['homepage-blogs'] });
    setDeleteId(null);
  };

  const saveCategory = async () => {
    const name = (editingCat?.name ?? newCatName).trim();
    if (!name) return toast.error('Name required');
    const slugInput = (editingCat?.slug ?? newCatSlug).trim();
    const slug = slugInput ? slugify(slugInput) : slugify(name);
    if (!slug) return toast.error('Slug required');
    const payload = { name, slug };
    const { error } = editingCat
      ? await supabase.from('blog_categories').update(payload).eq('id', editingCat.id)
      : await supabase.from('blog_categories').insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingCat ? 'Category updated' : 'Category added');
    setNewCatName('');
    setNewCatSlug('');
    setEditingCat(null);
    qc.invalidateQueries({ queryKey: ['blog-categories'] });
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('blog_categories').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Category deleted');
    qc.invalidateQueries({ queryKey: ['blog-categories'] });
    qc.invalidateQueries({ queryKey: ['admin-blogs'] });
  };

  const filtered = blogs?.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Blogs</h1>
          <p className="text-sm text-muted-foreground">Publish and manage blog posts</p>
        </div>
        <Button variant="outline" onClick={() => setCatOpen(true)}>
          <Tag className="mr-2 h-4 w-4" /> Add Blog Category
        </Button>
        <Button asChild>
          <Link to="/admin/blogs/new"><Plus className="mr-2 h-4 w-4" /> New Blog Post</Link>
        </Button>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <Card className="p-12 text-center text-muted-foreground">
          No blog posts yet. Click <strong>New Blog Post</strong> to create one.
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(blog => (
            <Card key={blog.id} className="p-4 flex items-center gap-4">
              {blog.cover_image_url ? (
                <img src={blog.cover_image_url} alt={blog.title} className="w-20 h-20 object-cover rounded shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-muted rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{blog.title}</h3>
                  {blog.is_published ? (
                    <Badge variant="default">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                  {(blog as any).blog_categories?.name && (
                    <Badge variant="outline">{(blog as any).blog_categories.name}</Badge>
                  )}
                  {blog.show_on_homepage && (
                    <Badge variant="outline" className="gap-1"><Star className="h-3 w-3" /> Homepage</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">/{blog.slug}</p>
                {blog.excerpt && <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{blog.excerpt}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                {blog.is_published && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/${blog.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/admin/blogs/${blog.id}`}><Pencil className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(blog.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this blog post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blog Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={editingCat ? 'Edit category name' : 'New category name'}
                value={editingCat?.name ?? newCatName}
                onChange={e => editingCat ? setEditingCat({ ...editingCat, name: e.target.value }) : setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveCategory()}
              />
              <Button onClick={saveCategory}>{editingCat ? 'Update' : 'Add'}</Button>
              {editingCat && (
                <Button variant="ghost" onClick={() => setEditingCat(null)}>Cancel</Button>
              )}
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {categories?.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No categories yet.</p>
              )}
              {categories?.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded border border-border">
                  <span className="text-sm">{cat.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCat({ id: cat.id, name: cat.name })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCategory(cat.id)}>
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogs;

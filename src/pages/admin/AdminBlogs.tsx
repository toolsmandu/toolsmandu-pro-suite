import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Eye, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminBlogs = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
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

  const filtered = blogs?.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Blogs</h1>
          <p className="text-sm text-muted-foreground">Publish and manage blog posts</p>
        </div>
        <Button asChild>
          <Link to="/admin/blogs/new"><Plus className="mr-2 h-4 w-4" /> New Blog Post</Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
    </div>
  );
};

export default AdminBlogs;

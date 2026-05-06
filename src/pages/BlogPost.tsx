import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const BlogPost = () => {
  const { slug } = useParams();

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs')
        .select('*, blog_categories(id, name)')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      return data;
    },
  });

  const categoryId = (blog as any)?.category_id;
  const categoryName = (blog as any)?.blog_categories?.name;

  const { data: related } = useQuery({
    queryKey: ['blog-related', categoryId, blog?.id],
    enabled: !!categoryId && !!blog?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, cover_image_url, published_at')
        .eq('is_published', true)
        .eq('category_id', categoryId)
        .neq('id', blog!.id)
        .order('published_at', { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
        <Button asChild variant="outline" className="mt-4"><Link to="/blog">Back to Blog</Link></Button>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{blog.title}</h1>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 flex-wrap">
        {blog.author_name && (
          <span className="flex items-center gap-1"><User className="h-4 w-4" /> {blog.author_name}</span>
        )}
        {blog.published_at && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(blog.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        )}
        {categoryName && (
          <Badge className="gap-1 bg-white/5 border border-white/10 text-foreground hover:bg-white/10">
            <Tag className="h-3 w-3" /> {categoryName}
          </Badge>
        )}
      </div>

      {blog.cover_image_url && (
        <img src={blog.cover_image_url} alt={blog.title} className="w-full rounded-lg mb-8 aspect-[16/9] object-cover" />
      )}

      <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: blog.content }} />

      {related && related.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles:</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map(r => (
              <Link key={r.id} to={`/${r.slug}`} className="group">
                <Card className="overflow-hidden h-full hover:border-primary transition-colors">
                  {r.cover_image_url ? (
                    <img src={r.cover_image_url} alt={r.title} className="w-full aspect-[16/9] object-cover" />
                  ) : (
                    <div className="w-full aspect-[16/9] bg-muted" />
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h3>
                    {r.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.excerpt}</p>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

export default BlogPost;

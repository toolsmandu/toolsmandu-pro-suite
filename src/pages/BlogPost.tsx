import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BlogPost = () => {
  const { slug } = useParams();

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase.from('blogs').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!blog) return;
    document.title = blog.meta_title || blog.title;
    const setMeta = (name: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('description', blog.meta_description || blog.excerpt || '');
    setMeta('keywords', blog.meta_keywords || '');

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/${blog.slug}`);

    // JSON-LD
    const existing = document.getElementById('blog-jsonld');
    if (existing) existing.remove();
    const ld = document.createElement('script');
    ld.id = 'blog-jsonld';
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: blog.title,
      description: blog.meta_description || blog.excerpt,
      image: blog.cover_image_url,
      datePublished: blog.published_at,
      author: blog.author_name ? { '@type': 'Person', name: blog.author_name } : undefined,
    });
    document.head.appendChild(ld);
  }, [blog]);

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
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" /> All Posts</Link>
      </Button>

      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{blog.title}</h1>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        {blog.author_name && (
          <span className="flex items-center gap-1"><User className="h-4 w-4" /> {blog.author_name}</span>
        )}
        {blog.published_at && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(blog.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        )}
      </div>

      {blog.cover_image_url && (
        <img src={blog.cover_image_url} alt={blog.title} className="w-full rounded-lg mb-8 aspect-[16/9] object-cover" />
      )}

      <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-img:rounded-lg" dangerouslySetInnerHTML={{ __html: blog.content }} />
    </article>
  );
};

export default BlogPost;

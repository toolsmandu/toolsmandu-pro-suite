import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

const HomepageBlogs = () => {
  const { data: blogs } = useQuery({
    queryKey: ['homepage-blogs'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('blogs')
        .select('id,title,slug,excerpt,cover_image_url,published_at')
        .eq('is_published', true)
        .eq('show_on_homepage', true)
        .order('sort_order', { ascending: true })
        .order('published_at', { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  if (!blogs?.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-foreground whitespace-nowrap">Blogs</h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <Link to="/blog">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium hover:bg-[rgb(59,130,246)] hover:text-white" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blogs.map(b => (
          <Link key={b.id} to={`/blog/${b.slug}`} className="group">
            <article className="bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg h-full flex flex-col">
              {b.cover_image_url ? (
                <div className="overflow-hidden">
                  <img src={b.cover_image_url} alt={b.title} className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ) : (
                <div className="w-full aspect-[16/9] bg-muted" />
              )}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{b.title}</h3>
                {b.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mt-2 flex-1">{b.excerpt}</p>}
                {b.published_at && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                    <Calendar className="h-3 w-3" />
                    {new Date(b.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomepageBlogs;

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar } from 'lucide-react';

const BlogList = () => {
  useEffect(() => {
    document.title = 'Blog - Toolsmandu';
  }, []);

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogs-list'],
    queryFn: async () => {
      const { data } = await supabase.from('blogs').select('*').eq('is_published', true).order('published_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">Tips, guides, and updates from Toolsmandu.</p>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !blogs?.length ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(b => (
            <Link key={b.id} to={`/${b.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                {b.cover_image_url ? (
                  <img src={b.cover_image_url} alt={b.title} className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted" />
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="font-semibold text-foreground line-clamp-2 group-hover:text-white transition-colors">{b.title}</h2>
                  {b.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mt-2 flex-1">{b.excerpt}</p>}
                  {b.published_at && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                      <Calendar className="h-3 w-3" />
                      {new Date(b.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;

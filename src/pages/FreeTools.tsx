import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Wrench } from 'lucide-react';

interface FreeTool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const FreeTools = () => {
  const [tools, setTools] = useState<FreeTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('free_tools')
        .select('id, name, slug, description, image_url')
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at', { ascending: false });
      setTools((data as FreeTool[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Free Tools</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : tools.length === 0 ? (
        <p className="text-muted-foreground">Free tools coming soon.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {tools.map((t) => (
            <Link
              key={t.id}
              to={`/free-tools/${t.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden border border-border hover:border-primary transition-colors"
              style={{ backgroundColor: '#0a2e5c' }}
            >
              <div className="relative w-full aspect-square overflow-hidden bg-muted/20 flex items-center justify-center">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <Wrench className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="p-3 text-center">
                <h3 className="font-semibold text-foreground line-clamp-2 text-sm">{t.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreeTools;

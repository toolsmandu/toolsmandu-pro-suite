import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FreeTool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tool_info: string | null;
  tool_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
}

const FreeTools = () => {
  const [tools, setTools] = useState<FreeTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('free_tools')
        .select('*')
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
        <div className="space-y-12">
          {tools.map((t) => (
            <section key={t.id} className="rounded-lg border border-border bg-card p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-foreground">{t.name}</h2>

              {t.tool_info && (
                <p className="mt-2 text-sm text-muted-foreground">{t.tool_info}</p>
              )}

              <div className="my-6 rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Tool coming soon.
              </div>

              {t.tool_description && (
                <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">
                  {t.tool_description}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreeTools;

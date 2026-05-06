import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ConvertCaseTool from '@/components/free-tools/ConvertCaseTool';
import StylishTextTool from '@/components/free-tools/StylishTextTool';

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

const TOOL_WIDGETS: Record<string, () => JSX.Element> = {
  'convert-case': () => <ConvertCaseTool />,
};

const FreeToolDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tool, setTool] = useState<FreeTool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('free_tools')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      setTool((data as FreeTool) || null);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!tool) return;
    document.title = tool.meta_title || tool.name;
    const setMeta = (name: string, content: string | null) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta('description', tool.meta_description);
    setMeta('keywords', tool.meta_keywords);
  }, [tool]);

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-muted-foreground">Loading…</div>;
  }

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">Tool not found</h1>
        <p className="text-muted-foreground">
          <Link to="/free-tools" className="underline">Back to Free Tools</Link>
        </p>
      </div>
    );
  }

  const Widget = TOOL_WIDGETS[tool.slug];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">{tool.name}</h1>

      {tool.tool_info && (
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">{tool.tool_info}</p>
      )}

      <div className="mt-8">
        {Widget ? (
          <Widget />
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Tool coming soon.
          </div>
        )}
      </div>

      {tool.tool_description && (
        <div className="mt-10 prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap">
          {tool.tool_description}
        </div>
      )}
    </div>
  );
};

export default FreeToolDetail;

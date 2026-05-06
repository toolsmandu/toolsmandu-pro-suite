import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Copy, Trash2 } from 'lucide-react';
import data from './fbEmojiData.json';

interface Group {
  name: string;
  emojis: { c: string; t: string }[];
}

const GROUPS = data as Group[];

const FacebookSymbolsTool = () => {
  const [text, setText] = useState('');

  const append = (c: string) => {
    setText((p) => p + c);
    navigator.clipboard.writeText(c).then(
      () => toast({ title: `Copied ${c}` }),
      () => undefined,
    );
  };

  const onCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const actionBtnStyle = { backgroundColor: '#338fe1', color: '#fff' } as const;

  return (
    <div className="border border-border overflow-hidden" style={{ backgroundColor: '#0a2e5c' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
        <span className="text-xs text-muted-foreground">Click any emoji to copy and add it to the box below.</span>
        <div className="flex gap-1">
          <Button size="sm" onClick={onCopy} disabled={!text} style={actionBtnStyle} className="hover:opacity-90">
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <Button size="sm" onClick={() => setText('')} disabled={!text} style={actionBtnStyle} className="hover:opacity-90">
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Click emojis below…"
        className="focus-visible:ring-ring flex w-full bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-y rounded-none border-b border-solid focus-visible:ring-0 focus-visible:ring-offset-0 text-base border-white border"
      />

      <div className="p-3 space-y-6">
        {GROUPS.map((g) => (
          <section key={g.name}>
            <h2 className="text-foreground font-semibold mb-2 text-lg">{g.name}</h2>
            <div className="flex flex-wrap gap-1">
              {g.emojis.map((e, i) => (
                <button
                  key={`${g.name}-${i}`}
                  type="button"
                  title={e.t}
                  onClick={() => append(e.c)}
                  className="w-9 h-9 flex items-center justify-center text-2xl rounded hover:bg-white/10 transition-colors"
                >
                  {e.c}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default FacebookSymbolsTool;

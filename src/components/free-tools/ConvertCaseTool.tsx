import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Copy, Download, Trash2 } from 'lucide-react';

type CaseType = 'sentence' | 'lower' | 'upper' | 'capitalized' | 'alternating' | 'title' | 'inverse';

const TITLE_MINOR = new Set([
  'a','an','and','as','at','but','by','en','for','if','in','of','on','or','the','to','via','vs','vs.','with','nor','per',
]);

const convert = (text: string, type: CaseType): string => {
  switch (type) {
    case 'lower':
      return text.toLowerCase();
    case 'upper':
      return text.toUpperCase();
    case 'capitalized':
      return text.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
    case 'sentence': {
      const lower = text.toLowerCase();
      return lower.replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());
    }
    case 'alternating':
      return text
        .split('')
        .map((ch, i) => (i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()))
        .join('');
    case 'title': {
      const parts = text.toLowerCase().split(/(\s+)/);
      let firstWordIdx = -1;
      let lastWordIdx = -1;
      parts.forEach((w, i) => {
        if (w.trim()) {
          if (firstWordIdx === -1) firstWordIdx = i;
          lastWordIdx = i;
        }
      });
      return parts
        .map((w, i) => {
          if (!w.trim()) return w;
          const lw = w.toLowerCase();
          if (i !== firstWordIdx && i !== lastWordIdx && TITLE_MINOR.has(lw)) return lw;
          return lw.replace(/^([a-z])/, (m) => m.toUpperCase());
        })
        .join('');
    }
    case 'inverse':
      return text
        .split('')
        .map((ch) => (ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase()))
        .join('');
    default:
      return text;
  }
};

const BUTTONS: { type: CaseType; label: string }[] = [
  { type: 'sentence', label: 'Sentence case' },
  { type: 'lower', label: 'lower case' },
  { type: 'upper', label: 'UPPER CASE' },
  { type: 'capitalized', label: 'Capitalized Case' },
  { type: 'alternating', label: 'aLtErNaTiNg cAsE' },
  { type: 'title', label: 'Title Case' },
  { type: 'inverse', label: 'InVeRsE CaSe' },
];

const ConvertCaseTool = () => {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text === '' ? 0 : text.split(/\n/).length;
    return { chars, words, lines };
  }, [text]);

  const apply = (type: CaseType) => setText((prev) => convert(prev, type));

  const onCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const onDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'convert-case.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onClear = () => setText('');

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <span>Characters: <span className="text-foreground font-medium">{stats.chars}</span></span>
          <span>Words: <span className="text-foreground font-medium">{stats.words}</span></span>
          <span>Lines: <span className="text-foreground font-medium">{stats.lines}</span></span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onCopy} disabled={!text}><Copy className="h-4 w-4" /> Copy</Button>
          <Button size="sm" variant="ghost" onClick={onDownload} disabled={!text}><Download className="h-4 w-4" /> Download</Button>
          <Button size="sm" variant="ghost" onClick={onClear} disabled={!text}><Trash2 className="h-4 w-4" /> Clear</Button>
        </div>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste your content here"
        className="min-h-[280px] resize-y rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
      />

      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 p-3">
        {BUTTONS.map((b) => (
          <Button key={b.type} variant="secondary" size="sm" onClick={() => apply(b.type)}>
            {b.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ConvertCaseTool;

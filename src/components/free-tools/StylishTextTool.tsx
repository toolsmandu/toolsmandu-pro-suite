import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

// ----- Unicode mappers -----
const cp = (n: number) => String.fromCodePoint(n);

const buildMap = (
  upperStart: number | null,
  lowerStart: number | null,
  digitStart: number | null,
  exceptions: Record<string, string> = {},
) => {
  const map: Record<string, string> = {};
  if (upperStart !== null) for (let i = 0; i < 26; i++) map[String.fromCharCode(65 + i)] = cp(upperStart + i);
  if (lowerStart !== null) for (let i = 0; i < 26; i++) map[String.fromCharCode(97 + i)] = cp(lowerStart + i);
  if (digitStart !== null) for (let i = 0; i < 10; i++) map[String.fromCharCode(48 + i)] = cp(digitStart + i);
  Object.assign(map, exceptions);
  return map;
};

const transform = (text: string, map: Record<string, string>) =>
  text.split('').map((c) => map[c] ?? c).join('');

// Bold
const M_BOLD = buildMap(0x1d400, 0x1d41a, 0x1d7ce);
// Italic (h replaced with planck constant 0x210e)
const M_ITALIC = buildMap(0x1d434, 0x1d44e, null, { h: cp(0x210e) });
// Bold Italic
const M_BOLD_ITALIC = buildMap(0x1d468, 0x1d482, null);
// Script (with reserved-letter exceptions)
const M_SCRIPT = buildMap(0x1d49c, 0x1d4b6, null, {
  B: cp(0x212c), E: cp(0x2130), F: cp(0x2131), H: cp(0x210b), I: cp(0x2110),
  L: cp(0x2112), M: cp(0x2133), R: cp(0x211b),
  e: cp(0x212f), g: cp(0x210a), o: cp(0x2134),
});
// Bold Script
const M_BOLD_SCRIPT = buildMap(0x1d4d0, 0x1d4ea, null);
// Fraktur
const M_FRAKTUR = buildMap(0x1d504, 0x1d51e, null, {
  C: cp(0x212d), H: cp(0x210c), I: cp(0x2111), R: cp(0x211c), Z: cp(0x2128),
});
// Bold Fraktur
const M_BOLD_FRAKTUR = buildMap(0x1d56c, 0x1d586, null);
// Double-struck
const M_DOUBLE = buildMap(0x1d538, 0x1d552, 0x1d7d8, {
  C: cp(0x2102), H: cp(0x210d), N: cp(0x2115), P: cp(0x2119),
  Q: cp(0x211a), R: cp(0x211d), Z: cp(0x2124),
});
// Sans-serif
const M_SANS = buildMap(0x1d5a0, 0x1d5ba, 0x1d7e2);
// Sans-serif Bold
const M_SANS_BOLD = buildMap(0x1d5d4, 0x1d5ee, 0x1d7ec);
// Sans-serif Italic
const M_SANS_ITALIC = buildMap(0x1d608, 0x1d622, null);
// Sans-serif Bold Italic
const M_SANS_BOLD_ITALIC = buildMap(0x1d63c, 0x1d656, null);
// Monospace
const M_MONO = buildMap(0x1d670, 0x1d68a, 0x1d7f6);

interface Style {
  name: string;
  map: Record<string, string>;
}

const STYLES: Style[] = [
  { name: 'Bold', map: M_BOLD },
  { name: 'Italic', map: M_ITALIC },
  { name: 'Bold Italic', map: M_BOLD_ITALIC },
  { name: 'Sans-serif Bold', map: M_SANS_BOLD },
  { name: 'Sans-serif Italic', map: M_SANS_ITALIC },
  { name: 'Sans-serif Bold Italic', map: M_SANS_BOLD_ITALIC },
  { name: 'Sans-serif', map: M_SANS },
  { name: 'Script', map: M_SCRIPT },
  { name: 'Bold Script', map: M_BOLD_SCRIPT },
  { name: 'Fraktur', map: M_FRAKTUR },
  { name: 'Bold Fraktur', map: M_BOLD_FRAKTUR },
  { name: 'Double-struck', map: M_DOUBLE },
  { name: 'Monospace', map: M_MONO },
];

const StylishTextTool = () => {
  const [text, setText] = useState('');

  const placeholder = 'Type or paste your text here…';
  const sample = useMemo(() => text || 'The quick brown fox jumps over the lazy dog 1234567890', [text]);

  const onCopy = async (val: string) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const btnStyle = { backgroundColor: '#338fe1', color: '#fff' } as const;

  return (
    <div className="rounded-lg border border-border overflow-hidden" style={{ backgroundColor: '#0a2e5c' }}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-h-[140px] resize-y rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
      />

      <div className="divide-y divide-border border-t border-border">
        {STYLES.map((s) => {
          const out = transform(sample, s.map);
          return (
            <div key={s.name} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
              <div className="sm:w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {s.name}
              </div>
              <div className="flex-1 min-w-0 break-words text-foreground text-base">{out}</div>
              <Button
                size="sm"
                onClick={() => onCopy(out)}
                style={btnStyle}
                className="hover:opacity-90 shrink-0"
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StylishTextTool;

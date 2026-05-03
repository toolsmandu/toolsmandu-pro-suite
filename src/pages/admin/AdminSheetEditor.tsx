import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spreadsheet, { Matrix, CellBase } from 'react-spreadsheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Cell = CellBase<string> & { value: string };

const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 12;

const makeEmpty = (rows: number, cols: number): Matrix<Cell> =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ value: '' }) as Cell),
  );

const AdminSheetEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Matrix<Cell>>(makeEmpty(DEFAULT_ROWS, DEFAULT_COLS));
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data: sheet, isLoading } = useQuery({
    queryKey: ['sheet', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sheets')
        .select('id, name, data, rows_count, cols_count')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!sheet) return;
    setName(sheet.name);
    const rows = sheet.rows_count || DEFAULT_ROWS;
    const cols = sheet.cols_count || DEFAULT_COLS;
    const stored = Array.isArray(sheet.data) ? (sheet.data as any[][]) : [];
    const grid = makeEmpty(rows, cols);
    stored.forEach((row, r) => {
      if (!Array.isArray(row)) return;
      row.forEach((v, c) => {
        if (grid[r] && grid[r][c]) grid[r][c] = { value: v == null ? '' : String(v) };
      });
    });
    setData(grid);
    setDirty(false);
  }, [sheet]);

  const handleChange = useCallback((next: Matrix<Cell>) => {
    setData(next);
    setDirty(true);
  }, []);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    const serialized = data.map((row) => row.map((c) => (c?.value ?? '')));
    const { error } = await supabase
      .from('sheets')
      .update({
        name: name.trim() || 'Untitled',
        data: serialized as any,
        rows_count: data.length,
        cols_count: data[0]?.length || DEFAULT_COLS,
      })
      .eq('id', id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved');
    setDirty(false);
  };

  const addRow = () => {
    const cols = data[0]?.length || DEFAULT_COLS;
    setData([...data, Array.from({ length: cols }, () => ({ value: '' } as Cell))]);
    setDirty(true);
  };
  const addCol = () => {
    setData(data.map((row) => [...row, { value: '' } as Cell]));
    setDirty(true);
  };

  const colLabels = useMemo(() => {
    const cols = data[0]?.length || DEFAULT_COLS;
    return Array.from({ length: cols }, (_, i) => {
      let n = i, s = '';
      do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
      return s;
    });
  }, [data]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sheets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setDirty(true); }}
          className="max-w-xs h-9 font-semibold"
        />
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" /> Row</Button>
        <Button variant="outline" size="sm" onClick={addCol}><Plus className="h-4 w-4 mr-1" /> Column</Button>
        <Button onClick={save} disabled={saving || !dirty} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          {dirty ? 'Save' : 'Saved'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: Use formulas like <code>=SUM(A1:A5)</code>, <code>=A1+B1</code>, <code>=AVERAGE(A1:A10)</code>.
      </p>

      <div className="border border-border rounded-lg overflow-auto bg-background p-2 sheet-wrap">
        <Spreadsheet
          data={data}
          onChange={handleChange as any}
          columnLabels={colLabels}
          darkMode
        />
      </div>
    </div>
  );
};

export default AdminSheetEditor;

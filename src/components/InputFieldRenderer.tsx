import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface InputFieldDef {
  id: string;
  name: string;
  field_type: 'email' | 'text' | 'password' | 'number' | 'checkbox';
  label: string;
  placeholder: string | null;
  is_required: boolean;
  checkbox_mode: 'single' | 'multi' | null;
  question: string | null;
  options: string[] | null;
}

export interface FieldResponse {
  field_id: string;
  field_name: string;
  field_type: string;
  label: string;
  question?: string | null;
  value: string | string[];
}

interface Props {
  field: InputFieldDef;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  error?: string;
}

const InputFieldRenderer = ({ field, value, onChange, error }: Props) => {
  if (field.field_type === 'checkbox') {
    const opts = (field.options as string[]) || [];
    if (field.checkbox_mode === 'single') {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            {field.question || field.label} {field.is_required && <span className="text-destructive">*</span>}
          </Label>
          <RadioGroup value={(value as string) || ''} onValueChange={(v) => onChange(v)} className="gap-2">
            {opts.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors">
                <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                <Label htmlFor={`${field.id}-${i}`} className="text-sm text-foreground cursor-pointer flex-1">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    }
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          {field.question || field.label} {field.is_required && <span className="text-destructive">*</span>}
        </Label>
        <div className="space-y-2">
          {opts.map((opt, i) => {
            const checked = arr.includes(opt);
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors">
                <Checkbox
                  id={`${field.id}-${i}`}
                  checked={checked}
                  onCheckedChange={(c) => {
                    if (c) onChange([...arr, opt]);
                    else onChange(arr.filter((x) => x !== opt));
                  }}
                />
                <Label htmlFor={`${field.id}-${i}`} className="text-sm text-foreground cursor-pointer flex-1">{opt}</Label>
              </div>
            );
          })}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground">
        {field.label} {field.is_required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        type={field.field_type}
        placeholder={field.placeholder || ''}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border-white/10 text-foreground placeholder:text-white/40"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export const validateField = (field: InputFieldDef, value: string | string[] | undefined): string | null => {
  const isEmpty =
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (field.is_required && isEmpty) return 'This field is required';
  if (isEmpty) return null;

  if (field.field_type === 'email' && typeof value === 'string') {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return 'Enter a valid email';
  }
  if (field.field_type === 'number' && typeof value === 'string') {
    if (Number.isNaN(Number(value))) return 'Enter a valid number';
  }
  return null;
};

export default InputFieldRenderer;

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value?: string | null;
  className?: string;
  label?: string;
}

const CopyButton = ({ value, className, label = 'Copied to clipboard' }: CopyButtonProps) => {
  if (!value || value === '-' || value === '—') return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        toast.success(label);
      }}
      className={cn(
        'inline-flex align-middle ml-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0',
        className,
      )}
      title="Copy"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
};

export default CopyButton;

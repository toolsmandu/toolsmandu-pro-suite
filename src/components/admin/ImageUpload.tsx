import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const ImageUpload = ({ value, onChange, label = 'Image' }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Max 10MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Track in media table
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      await (supabase.from('media' as any) as any).insert({
        file_name: file.name,
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      onChange(publicUrl);
      toast.success('File uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="mt-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative w-full rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 p-6 cursor-pointer disabled:opacity-60"
        >
          {value ? (
            <div className="flex items-center gap-3 w-full">
              <img src={value} alt="Preview" className="h-20 w-20 object-cover rounded border border-border shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground">Click to replace</p>
                <p className="text-xs text-muted-foreground truncate">{value}</p>
              </div>
              <Upload className={`h-5 w-5 text-primary ${uploading ? 'animate-pulse' : ''}`} />
            </div>
          ) : (
            <>
              <div className="rounded-full bg-primary/15 p-3">
                <Upload className={`h-6 w-6 text-primary ${uploading ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {uploading ? 'Uploading…' : 'Click to upload image'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF or video up to 10MB</p>
              </div>
            </>
          )}
        </button>
        <div className="flex gap-2 mt-2">
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Or paste image URL"
            className="flex-1 h-9 text-xs"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onChange('')}
              title="Clear"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;

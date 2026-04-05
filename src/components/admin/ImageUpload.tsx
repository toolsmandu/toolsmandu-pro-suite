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
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Image URL or upload"
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          title="Upload file"
        >
          <Upload className={`h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            title="Clear"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <div className="mt-2">
          <img src={value} alt="Preview" className="h-16 w-16 object-cover rounded border border-border" />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

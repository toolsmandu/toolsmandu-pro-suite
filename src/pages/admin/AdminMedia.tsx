import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Pencil, Upload, Search, Image as ImageIcon, Video } from 'lucide-react';

const AdminMedia = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: media, isLoading } = useQuery({
    queryKey: ['admin-media'],
    queryFn: async () => {
      const { data } = await (supabase.from('media' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
  });

  const filtered = media?.filter(m =>
    m.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        const filePath = `media/${fileName}`;

        const { error } = await supabase.storage.from('assets').upload(filePath, file);
        if (error) throw error;

        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        await (supabase.from('media' as any) as any).insert({
          file_name: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('Files uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const renameMutation = useMutation({
    mutationFn: async () => {
      if (!renameItem || !newName.trim()) return;
      await (supabase.from('media' as any) as any).update({ file_name: newName.trim() }).eq('id', renameItem.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      setRenameOpen(false);
      toast.success('Renamed!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: any) => {
      await supabase.storage.from('assets').remove([item.file_path]);
      await (supabase.from('media' as any) as any).delete().eq('id', item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('Deleted!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const copyUrl = (filePath: string) => {
    navigator.clipboard.writeText(getPublicUrl(filePath));
    toast.success('URL copied!');
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Media</h2>
        <div>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            id="media-upload"
            onChange={handleUpload}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="media-upload" className="cursor-pointer">
              <Upload className={`h-4 w-4 mr-2 ${uploading ? 'animate-pulse' : ''}`} />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </label>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered?.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No media files found. Upload some!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered?.map(item => (
            <div key={item.id} className="border border-border rounded-lg overflow-hidden group relative">
              <div className="aspect-square bg-muted/30 flex items-center justify-center cursor-pointer" onClick={() => copyUrl(item.file_path)}>
                {item.file_type === 'video' ? (
                  <Video className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <img
                    src={getPublicUrl(item.file_path)}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-foreground truncate" title={item.file_name}>{item.file_name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.file_size)}</p>
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setRenameItem(item); setNewName(item.file_name); setRenameOpen(true); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { if (confirm('Delete this file permanently?')) deleteMutation.mutate(item); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename File</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="File name" />
            <Button onClick={() => renameMutation.mutate()} className="w-full" disabled={!newName.trim()}>
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMedia;

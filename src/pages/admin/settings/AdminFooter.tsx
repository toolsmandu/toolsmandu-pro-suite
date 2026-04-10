import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';

const AdminFooter = () => {
  const queryClient = useQueryClient();

  const [footerAbout, setFooterAbout] = useState('');
  const [footerBgColor, setFooterBgColor] = useState('#011D3E');
  const [footerTextColor, setFooterTextColor] = useState('#ffffff');
  const [footerCopyright, setFooterCopyright] = useState('© {year} Toolsmandu. All rights reserved.');
  const [footerReviewsTitle, setFooterReviewsTitle] = useState('Check Our Reviews');
  const [footerTrustpilotImage, setFooterTrustpilotImage] = useState('');
  const [footerTrustpilotLink, setFooterTrustpilotLink] = useState('');
  const [footerGoogleImage, setFooterGoogleImage] = useState('');
  const [footerGoogleLink, setFooterGoogleLink] = useState('');
  const [footerPaymentImage, setFooterPaymentImage] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState({ column_name: '', label: '', url: '', sort_order: '0' });
  const [editLinkDialogOpen, setEditLinkDialogOpen] = useState(false);
  const [editLink, setEditLink] = useState<{ id: string; column_name: string; label: string; url: string; sort_order: string }>({ id: '', column_name: '', label: '', url: '', sort_order: '0' });

  useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      const map = data?.reduce((acc, s) => ({ ...acc, [s.key]: s }), {} as Record<string, any>) || {};
      setFooterAbout(map.footer_about?.value || '');
      setFooterBgColor(map.footer_bg_color?.value || '#011D3E');
      setFooterTextColor(map.footer_text_color?.value || '#ffffff');
      setFooterCopyright(map.footer_copyright?.value || '© {year} Toolsmandu. All rights reserved.');
      setFooterReviewsTitle(map.footer_reviews_title?.value || 'Check Our Reviews');
      setFooterTrustpilotImage(map.footer_trustpilot_image?.value || '');
      setFooterTrustpilotLink(map.footer_trustpilot_link?.value || '');
      setFooterGoogleImage(map.footer_google_image?.value || '');
      setFooterGoogleLink(map.footer_google_link?.value || '');
      setFooterPaymentImage(map.footer_payment_image?.value || '');
      return map;
    },
  });

  const { data: footerLinks } = useQuery({
    queryKey: ['admin-footer-links'],
    queryFn: async () => {
      const { data } = await supabase.from('footer_links').select('*').order('column_name').order('sort_order');
      return data || [];
    },
  });

  const saveFooterSettings = async () => {
    const keys = [
      { key: 'footer_about', value: footerAbout },
      { key: 'footer_bg_color', value: footerBgColor },
      { key: 'footer_text_color', value: footerTextColor },
      { key: 'footer_copyright', value: footerCopyright },
      { key: 'footer_reviews_title', value: footerReviewsTitle },
      { key: 'footer_trustpilot_image', value: footerTrustpilotImage },
      { key: 'footer_trustpilot_link', value: footerTrustpilotLink },
      { key: 'footer_google_image', value: footerGoogleImage },
      { key: 'footer_google_link', value: footerGoogleLink },
      { key: 'footer_payment_image', value: footerPaymentImage },
    ];
    for (const item of keys) {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', item.key).maybeSingle();
      if (existing) {
        await supabase.from('site_settings').update({ value: item.value }).eq('key', item.key);
      } else {
        await supabase.from('site_settings').insert(item);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    toast.success('Footer settings saved!');
  };

  const addLink = useMutation({
    mutationFn: async () => {
      await supabase.from('footer_links').insert({ ...newLink, sort_order: parseInt(newLink.sort_order) || 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-footer-links'] });
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
      setDialogOpen(false);
      setNewLink({ column_name: '', label: '', url: '', sort_order: '0' });
      toast.success('Link added!');
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => { await supabase.from('footer_links').delete().eq('id', id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-footer-links'] });
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
    },
  });

  const updateLink = useMutation({
    mutationFn: async () => {
      await supabase.from('footer_links').update({
        column_name: editLink.column_name, label: editLink.label,
        url: editLink.url, sort_order: parseInt(editLink.sort_order) || 0,
      }).eq('id', editLink.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-footer-links'] });
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
      setEditLinkDialogOpen(false);
      toast.success('Link updated!');
    },
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground">Footer</h2>

      {/* Footer Appearance */}
      <Card>
        <CardHeader><CardTitle>Footer Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={footerBgColor} onChange={e => setFooterBgColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={footerBgColor} onChange={e => setFooterBgColor(e.target.value)} placeholder="#011D3E" />
              </div>
            </div>
            <div>
              <Label>Text Color</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={footerTextColor} onChange={e => setFooterTextColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={footerTextColor} onChange={e => setFooterTextColor(e.target.value)} placeholder="#ffffff" />
              </div>
            </div>
          </div>
          <div>
            <Label>Copyright Text</Label>
            <Input value={footerCopyright} onChange={e => setFooterCopyright(e.target.value)} placeholder="© {year} Toolsmandu. All rights reserved." />
            <p className="text-xs text-muted-foreground mt-1">Use {'{year}'} to auto-insert the current year.</p>
          </div>
          <div>
            <Label>Reviews Section Title</Label>
            <Input value={footerReviewsTitle} onChange={e => setFooterReviewsTitle(e.target.value)} placeholder="Check Our Reviews" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ImageUpload value={footerTrustpilotImage} onChange={setFooterTrustpilotImage} label="Trustpilot Image" />
              <div><Label>Trustpilot Link URL</Label><Input value={footerTrustpilotLink} onChange={e => setFooterTrustpilotLink(e.target.value)} placeholder="https://..." /></div>
            </div>
            <div className="space-y-2">
              <ImageUpload value={footerGoogleImage} onChange={setFooterGoogleImage} label="Google Reviews Image" />
              <div><Label>Google Reviews Link URL</Label><Input value={footerGoogleLink} onChange={e => setFooterGoogleLink(e.target.value)} placeholder="https://..." /></div>
            </div>
          </div>
          <ImageUpload value={footerPaymentImage} onChange={setFooterPaymentImage} label="Payment Methods Image" />
          <Button onClick={saveFooterSettings}>Save Footer Settings</Button>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Footer Links</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Footer Link</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Column</Label><Input value={newLink.column_name} onChange={e => setNewLink({...newLink, column_name: e.target.value})} placeholder="e.g. Information" /></div>
                  <div><Label>Label</Label><Input value={newLink.label} onChange={e => setNewLink({...newLink, label: e.target.value})} /></div>
                  <div><Label>URL</Label><Input value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} /></div>
                  <div><Label>Sort Order</Label><Input type="number" value={newLink.sort_order} onChange={e => setNewLink({...newLink, sort_order: e.target.value})} /></div>
                  <Button onClick={() => newLink.column_name && newLink.label && addLink.mutate()} className="w-full">Add Link</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Footer About Text</Label><RichTextEditor value={footerAbout} onChange={setFooterAbout} /></div>
          <Button onClick={saveFooterSettings} size="sm">Save About Text</Button>
          <Table>
            <TableHeader><TableRow><TableHead>Column</TableHead><TableHead>Label</TableHead><TableHead>URL</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {footerLinks?.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-foreground">{l.column_name}</TableCell>
                  <TableCell className="text-foreground">{l.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{l.url}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditLink({ id: l.id, column_name: l.column_name, label: l.label, url: l.url, sort_order: String(l.sort_order) }); setEditLinkDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLink.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={editLinkDialogOpen} onOpenChange={setEditLinkDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Footer Link</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Column</Label><Input value={editLink.column_name} onChange={e => setEditLink({...editLink, column_name: e.target.value})} /></div>
                <div><Label>Label</Label><Input value={editLink.label} onChange={e => setEditLink({...editLink, label: e.target.value})} /></div>
                <div><Label>URL</Label><Input value={editLink.url} onChange={e => setEditLink({...editLink, url: e.target.value})} /></div>
                <div><Label>Sort Order</Label><Input type="number" value={editLink.sort_order} onChange={e => setEditLink({...editLink, sort_order: e.target.value})} /></div>
                <Button onClick={() => editLink.column_name && editLink.label && updateLink.mutate()} className="w-full">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFooter;

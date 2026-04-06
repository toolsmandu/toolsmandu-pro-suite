import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/admin/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, MessageCircle } from 'lucide-react';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState('');
  const [footerAbout, setFooterAbout] = useState('');
  const [orderMode, setOrderMode] = useState('cart');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState({ column_name: '', label: '', url: '', sort_order: '0' });

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      const map = data?.reduce((acc, s) => ({ ...acc, [s.key]: s }), {} as Record<string, any>) || {};
      setLogoUrl(map.logo_url?.value || '');
      setFooterAbout(map.footer_about?.value || '');
      setOrderMode(map.order_mode?.value || 'cart');
      setWhatsappNumber(map.whatsapp_number?.value || '');
      setFaviconUrl(map.favicon_url?.value || '');
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

  const saveSettings = async () => {
    const keys = [
      { key: 'logo_url', value: logoUrl },
      { key: 'footer_about', value: footerAbout },
      { key: 'order_mode', value: orderMode },
      { key: 'whatsapp_number', value: whatsappNumber },
      { key: 'favicon_url', value: faviconUrl },
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
    toast.success('Settings saved!');
  };

  const addLink = useMutation({
    mutationFn: async () => {
      await supabase.from('footer_links').insert({ ...newLink, sort_order: parseInt(newLink.sort_order) || 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-footer-links'] });
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
      setDialogOpen(false); setNewLink({ column_name: '', label: '', url: '', sort_order: '0' });
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Order Mode</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={orderMode} onValueChange={setOrderMode} className="space-y-3">
            <label
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                orderMode === "cart" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}
            >
              <RadioGroupItem value="cart" id="cart" />
              <ShoppingCart className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <Label htmlFor="cart" className="font-semibold text-foreground cursor-pointer">Enable Add to Cart</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Customers can add products to cart and checkout.</p>
              </div>
            </label>
            <label
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                orderMode === "whatsapp" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}
            >
              <RadioGroupItem value="whatsapp" id="whatsapp" />
              <MessageCircle className="h-5 w-5 text-success flex-shrink-0" />
              <div>
                <Label htmlFor="whatsapp" className="font-semibold text-foreground cursor-pointer">Show WhatsApp CTA</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Customers order via WhatsApp message instead of cart.</p>
              </div>
            </label>
          </RadioGroup>

          {orderMode === "whatsapp" && (
            <div className="space-y-2 pl-1">
              <Label className="text-sm font-medium text-foreground">WhatsApp Number</Label>
              <Input
                placeholder="e.g. 9779800000000"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Include country code without + sign.</p>
            </div>
          )}

          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Site Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload value={logoUrl} onChange={setLogoUrl} label="Site Logo" />
          <div><Label>Footer About Text</Label><Textarea value={footerAbout} onChange={e => setFooterAbout(e.target.value)} rows={3} /></div>
          <ImageUpload value={faviconUrl} onChange={setFaviconUrl} label="Favicon Image" />
          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>

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
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Column</TableHead><TableHead>Label</TableHead><TableHead>URL</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {footerLinks?.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-foreground">{l.column_name}</TableCell>
                  <TableCell className="text-foreground">{l.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{l.url}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLink.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;

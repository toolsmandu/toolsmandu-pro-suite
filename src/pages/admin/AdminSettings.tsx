import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, MessageCircle, Pencil, icons } from 'lucide-react';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState('');
  const [footerAbout, setFooterAbout] = useState('');
  const [orderMode, setOrderMode] = useState('cart');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState({ column_name: '', label: '', url: '', sort_order: '0' });
  const [editLinkDialogOpen, setEditLinkDialogOpen] = useState(false);
  const [editLink, setEditLink] = useState<{ id: string; column_name: string; label: string; url: string; sort_order: string }>({ id: '', column_name: '', label: '', url: '', sort_order: '0' });

  // Footer appearance state
  const [footerBgColor, setFooterBgColor] = useState('#011D3E');
  const [footerTextColor, setFooterTextColor] = useState('#ffffff');
  const [footerCopyright, setFooterCopyright] = useState('© {year} Toolsmandu. All rights reserved.');
  const [footerReviewsTitle, setFooterReviewsTitle] = useState('Check Our Reviews');
  const [footerTrustpilotImage, setFooterTrustpilotImage] = useState('');
  const [footerTrustpilotLink, setFooterTrustpilotLink] = useState('');
  const [footerGoogleImage, setFooterGoogleImage] = useState('');
  const [footerGoogleLink, setFooterGoogleLink] = useState('');
  const [footerPaymentImage, setFooterPaymentImage] = useState('');

  // Nav menu state
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [editNavDialogOpen, setEditNavDialogOpen] = useState(false);
  const [newNavItem, setNewNavItem] = useState({ label: '', url: '', icon: '', sort_order: '0' });
  const [editNavItem, setEditNavItem] = useState<{ id: string; label: string; url: string; icon: string; sort_order: string }>({ id: '', label: '', url: '', icon: '', sort_order: '0' });
  const [iconSearch, setIconSearch] = useState('');

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

  const { data: navItems } = useQuery({
    queryKey: ['admin-nav-menu-items'],
    queryFn: async () => {
      const { data } = await supabase.from('nav_menu_items').select('*').order('sort_order');
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

  const updateLink = useMutation({
    mutationFn: async () => {
      await supabase.from('footer_links').update({
        column_name: editLink.column_name,
        label: editLink.label,
        url: editLink.url,
        sort_order: parseInt(editLink.sort_order) || 0,
      }).eq('id', editLink.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-footer-links'] });
      queryClient.invalidateQueries({ queryKey: ['footer-links'] });
      setEditLinkDialogOpen(false);
      toast.success('Link updated!');
    },
  });

  // Nav menu mutations
  const addNavItem = useMutation({
    mutationFn: async () => {
      await supabase.from('nav_menu_items').insert({
        label: newNavItem.label,
        url: newNavItem.url,
        icon: newNavItem.icon || null,
        sort_order: parseInt(newNavItem.sort_order) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
      setNavDialogOpen(false);
      setNewNavItem({ label: '', url: '', icon: '', sort_order: '0' });
      toast.success('Menu item added!');
    },
  });

  const deleteNavItem = useMutation({
    mutationFn: async (id: string) => { await supabase.from('nav_menu_items').delete().eq('id', id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
      toast.success('Menu item deleted!');
    },
  });

  const toggleNavItem = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('nav_menu_items').update({ is_active }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
    },
  });

  const updateNavItem = useMutation({
    mutationFn: async () => {
      await supabase.from('nav_menu_items').update({
        label: editNavItem.label,
        url: editNavItem.url,
        icon: editNavItem.icon || null,
        sort_order: parseInt(editNavItem.sort_order) || 0,
      }).eq('id', editNavItem.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nav-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['nav-menu-items'] });
      setEditNavDialogOpen(false);
      toast.success('Menu item updated!');
    },
  });

  // Filter icon names for search
  const iconNames = Object.keys(icons).filter(name => name !== 'createLucideIcon');
  const filteredIcons = iconSearch
    ? iconNames.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 30)
    : [];

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const LucideIcon = (icons as Record<string, any>)[iconName];
    if (!LucideIcon) return null;
    return <LucideIcon className="h-4 w-4" />;
  };

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
          <ImageUpload value={faviconUrl} onChange={setFaviconUrl} label="Favicon Image" />
          <ImageUpload value={faviconUrl} onChange={setFaviconUrl} label="Favicon Image" />
          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>

      {/* Navigation Menu Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Navigation Menu</CardTitle>
            <Dialog open={navDialogOpen} onOpenChange={setNavDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Label</Label><Input value={newNavItem.label} onChange={e => setNewNavItem({...newNavItem, label: e.target.value})} placeholder="e.g. Streaming" /></div>
                  <div><Label>URL</Label><Input value={newNavItem.url} onChange={e => setNewNavItem({...newNavItem, url: e.target.value})} placeholder="e.g. /category/streaming" /></div>
                  <div>
                    <Label>Icon (Lucide icon name)</Label>
                    <Input
                      value={newNavItem.icon}
                      onChange={e => { setNewNavItem({...newNavItem, icon: e.target.value}); setIconSearch(e.target.value); }}
                      placeholder="e.g. Tv, Music, ShoppingBag"
                    />
                    {iconSearch && filteredIcons.length > 0 && (
                      <div className="mt-1 max-h-32 overflow-y-auto border border-border rounded-md bg-background p-2 grid grid-cols-4 gap-1">
                        {filteredIcons.map(name => {
                          const Icon = (icons as Record<string, any>)[name];
                          return (
                            <button
                              key={name}
                              type="button"
                              className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-xs hover:bg-secondary transition-colors ${newNavItem.icon === name ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                              onClick={() => { setNewNavItem({...newNavItem, icon: name}); setIconSearch(''); }}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="truncate w-full text-center text-[10px]">{name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div><Label>Sort Order</Label><Input type="number" value={newNavItem.sort_order} onChange={e => setNewNavItem({...newNavItem, sort_order: e.target.value})} /></div>
                  <Button onClick={() => newNavItem.label && newNavItem.url && addNavItem.mutate()} className="w-full">Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {navItems?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{renderIcon(item.icon)}</TableCell>
                  <TableCell className="text-foreground font-medium">{item.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.url}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sort_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(checked) => toggleNavItem.mutate({ id: item.id, is_active: checked })}
                    />
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditNavItem({ id: item.id, label: item.label, url: item.url, icon: item.icon || '', sort_order: String(item.sort_order) });
                      setEditNavDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNavItem.mutate(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!navItems?.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No menu items yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {/* Edit Nav Item Dialog */}
          <Dialog open={editNavDialogOpen} onOpenChange={setEditNavDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Label</Label><Input value={editNavItem.label} onChange={e => setEditNavItem({...editNavItem, label: e.target.value})} /></div>
                <div><Label>URL</Label><Input value={editNavItem.url} onChange={e => setEditNavItem({...editNavItem, url: e.target.value})} /></div>
                <div>
                  <Label>Icon (Lucide icon name)</Label>
                  <Input
                    value={editNavItem.icon}
                    onChange={e => { setEditNavItem({...editNavItem, icon: e.target.value}); setIconSearch(e.target.value); }}
                    placeholder="e.g. Tv, Music, ShoppingBag"
                  />
                  {iconSearch && filteredIcons.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto border border-border rounded-md bg-background p-2 grid grid-cols-4 gap-1">
                      {filteredIcons.map(name => {
                        const Icon = (icons as Record<string, any>)[name];
                        return (
                          <button
                            key={name}
                            type="button"
                            className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-xs hover:bg-secondary transition-colors ${editNavItem.icon === name ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                            onClick={() => { setEditNavItem({...editNavItem, icon: name}); setIconSearch(''); }}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="truncate w-full text-center text-[10px]">{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div><Label>Sort Order</Label><Input type="number" value={editNavItem.sort_order} onChange={e => setEditNavItem({...editNavItem, sort_order: e.target.value})} /></div>
                <Button onClick={() => editNavItem.label && editNavItem.url && updateNavItem.mutate()} className="w-full">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

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
          <Button onClick={saveSettings}>Save Footer Settings</Button>
        </CardContent>
      </Card>

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
          <Button onClick={saveSettings} size="sm">Save About Text</Button>
          <Table>
            <TableHeader><TableRow><TableHead>Column</TableHead><TableHead>Label</TableHead><TableHead>URL</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {footerLinks?.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-foreground">{l.column_name}</TableCell>
                  <TableCell className="text-foreground">{l.label}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{l.url}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditLink({ id: l.id, column_name: l.column_name, label: l.label, url: l.url, sort_order: String(l.sort_order) });
                      setEditLinkDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLink.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Edit Footer Link Dialog */}
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

export default AdminSettings;

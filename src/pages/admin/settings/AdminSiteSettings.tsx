import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/admin/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AdminSiteSettings = () => {
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [emailLogoUrl, setEmailLogoUrl] = useState('');
  const [productTopBannerImage, setProductTopBannerImage] = useState('');
  const [productTopBannerOpacity, setProductTopBannerOpacity] = useState(1);

  useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      const map = data?.reduce((acc, s) => ({ ...acc, [s.key]: s }), {} as Record<string, any>) || {};
      setLogoUrl(map.logo_url?.value || '');
      setFaviconUrl(map.favicon_url?.value || '');
      setEmailLogoUrl(map.email_logo_url?.value || '');
      setProductTopBannerImage(map.product_top_banner_image?.value || '');
      const op = parseFloat(map.product_top_banner_opacity?.value);
      setProductTopBannerOpacity(isNaN(op) ? 1 : Math.max(0, Math.min(1, op)));
      return map;
    },
  });

  const saveSettings = async () => {
    const keys = [
      { key: 'logo_url', value: logoUrl },
      { key: 'favicon_url', value: faviconUrl },
      { key: 'email_logo_url', value: emailLogoUrl },
      { key: 'product_top_banner_image', value: productTopBannerImage },
      { key: 'product_top_banner_opacity', value: String(productTopBannerOpacity) },
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
    queryClient.invalidateQueries({ queryKey: ['order-mode-settings'] });
    toast.success('Site settings saved!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Site Settings</h2>
      <Card>
        <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload value={logoUrl} onChange={setLogoUrl} label="Site Logo" />
          <ImageUpload value={faviconUrl} onChange={setFaviconUrl} label="Favicon Image" />
          <div>
            <ImageUpload value={emailLogoUrl} onChange={setEmailLogoUrl} label="Email Logo" />
            <p className="text-xs text-muted-foreground mt-1">
              Shown centered at the top of authentication emails (signup OTP, password reset, etc.). If empty, the site logo is used.
            </p>
          </div>
          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Product Page Top Banner</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            value={productTopBannerImage}
            onChange={setProductTopBannerImage}
            label="Top Banner Image"
          />
          <p className="text-xs text-muted-foreground -mt-2">
            Displayed on every product page, just below the top navigation menu and above the product name and variation section. Leave empty to hide.
          </p>

          <div>
            <Label>Banner Opacity: {Math.round(productTopBannerOpacity * 100)}%</Label>
            <Slider
              className="mt-2"
              min={0}
              max={1}
              step={0.05}
              value={[productTopBannerOpacity]}
              onValueChange={(v) => setProductTopBannerOpacity(v[0])}
            />
          </div>

          {productTopBannerImage && (
            <div className="border border-border rounded p-2 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <img
                src={productTopBannerImage}
                alt="Banner preview"
                className="w-full h-auto rounded"
                style={{ opacity: productTopBannerOpacity }}
              />
            </div>
          )}

          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSiteSettings;

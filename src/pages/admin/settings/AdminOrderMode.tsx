import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminOrderMode = () => {
  const queryClient = useQueryClient();
  const [orderMode, setOrderMode] = useState('cart');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      const map = data?.reduce((acc, s) => ({ ...acc, [s.key]: s }), {} as Record<string, any>) || {};
      setOrderMode(map.order_mode?.value || 'cart');
      setWhatsappNumber(map.whatsapp_number?.value || '');
      return map;
    },
  });

  const saveSettings = async () => {
    const keys = [
      { key: 'order_mode', value: orderMode },
      { key: 'whatsapp_number', value: whatsappNumber },
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
    toast.success('Order mode saved!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Order Mode</h2>
      <Card>
        <CardHeader><CardTitle>Order Mode</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={orderMode} onValueChange={setOrderMode} className="space-y-3">
            <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${orderMode === "cart" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}>
              <RadioGroupItem value="cart" id="cart" />
              <ShoppingCart className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <Label htmlFor="cart" className="font-semibold text-foreground cursor-pointer">Enable Add to Cart</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Customers can add products to cart and checkout.</p>
              </div>
            </label>
            <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${orderMode === "whatsapp" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}>
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
              <Input placeholder="e.g. 9779800000000" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
              <p className="text-xs text-muted-foreground">Include country code without + sign.</p>
            </div>
          )}

          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrderMode;

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';

const AdminMaintenance = () => {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);

  useQuery({
    queryKey: ['admin-maintenance-mode'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      setEnabled(data?.value === 'true');
      return data;
    },
  });

  const save = async () => {
    const value = enabled ? 'true' : 'false';
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'maintenance_mode')
      .maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value }).eq('key', 'maintenance_mode');
    } else {
      await supabase.from('site_settings').insert({ key: 'maintenance_mode', value });
    }
    queryClient.invalidateQueries({ queryKey: ['admin-maintenance-mode'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance-mode'] });
    toast.success('Maintenance mode updated!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Maintenance Mode</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Payment Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <Label className="font-semibold text-foreground">Enable Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground mt-1">
                When enabled, the "Add to Cart" button on every product page is disabled and a maintenance notice is shown to customers.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <Button onClick={save}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMaintenance;

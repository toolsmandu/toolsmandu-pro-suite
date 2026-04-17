import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    // Update email + phone via edge function (uses service role to skip email verification)
    const { data, error: fnError } = await supabase.functions.invoke('update-own-profile', {
      body: { email: email.trim(), phone },
    });
    if (fnError || (data && (data as any).error)) {
      toast.error(((data as any)?.error) || fnError?.message || 'Failed to update profile');
      setSaving(false);
      return;
    }

    if (newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }

    await refreshProfile();
    toast.success('Profile updated! Use your new email next time you sign in.');
    setNewPassword('');
    setSaving(false);
  };

  return (
    <Card style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
      <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        
        <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} className="border-0" /></div>
        <div><Label>WhatsApp Number</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+977XXXXXXXXXX" className="border-0" /></div>
        <div><Label>New Password (leave blank to keep current)</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="border-0" /></div>
        <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </CardContent>
    </Card>
  );
};

export default ProfilePage;

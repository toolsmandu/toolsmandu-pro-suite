import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error'>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        });
        const data = await res.json();
        if (data.valid) setState('valid');
        else if (data.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      } catch {
        setState('error');
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
    setSubmitting(false);
    if (error) { setState('error'); return; }
    if (data?.success) setState('success');
    else if (data?.reason === 'already_unsubscribed') setState('already');
    else setState('error');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Unsubscribe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === 'loading' && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Validating link…</div>}
          {state === 'valid' && (
            <>
              <p className="text-sm text-muted-foreground">Click below to confirm you no longer wish to receive emails from Toolsmandu.</p>
              <Button onClick={handleConfirm} disabled={submitting} className="w-full">
                {submitting ? 'Processing…' : 'Confirm Unsubscribe'}
              </Button>
            </>
          )}
          {state === 'success' && <p className="text-sm">You've been unsubscribed. You will no longer receive promotional emails from us.</p>}
          {state === 'already' && <p className="text-sm">This email address has already been unsubscribed.</p>}
          {state === 'invalid' && <p className="text-sm text-destructive">This unsubscribe link is invalid or expired.</p>}
          {state === 'error' && <p className="text-sm text-destructive">Something went wrong. Please try again later.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;

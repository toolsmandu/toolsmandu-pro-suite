import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().trim().email({ message: 'Enter a valid email' }).max(255);

interface NotifyMeProps {
  productId: string;
  productName?: string;
}

const NotifyMe = ({ productId, productName }: NotifyMeProps) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('waiting_list')
        .insert({ email: parsed.data, product_id: productId });
      if (error && !error.message.toLowerCase().includes('duplicate')) {
        throw error;
      }
      setDone(true);
      toast.success(
        productName
          ? `You're on the waiting list for ${productName}!`
          : "You're on the waiting list!"
      );
    } catch (err: any) {
      toast.error(err.message || 'Could not join waiting list');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-3 rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-50/10 to-yellow-50/5 p-5 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-300">
          <Bell className="h-6 w-6 text-amber-900" />
        </div>
        <p className="font-semibold text-foreground">You're on the list!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          We'll email you the moment it's back in stock.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-50/10 to-yellow-50/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-300">
          <Bell className="h-4 w-4 text-amber-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">
            Notify me when this product is available
          </p>
          <p className="text-xs text-muted-foreground">
            Get an email the moment it's back.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className="flex-1"
          required
        />
        <Button
          type="submit"
          disabled={submitting}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 hover:from-amber-400 hover:to-yellow-400 font-semibold shadow-md"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Bell className="h-4 w-4 mr-1" />
              Notify Me!
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default NotifyMe;

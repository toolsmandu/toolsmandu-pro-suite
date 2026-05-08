import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'completed' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const gw = searchParams.get('gw');

    // Nepal Payment Solution flow
    if (gw === 'nps') {
      const merchantTxnId =
        searchParams.get('MerchantTxnId') ||
        searchParams.get('merchant_txn_id') ||
        searchParams.get('MerchantTxnID');
      const mode = searchParams.get('mode') || 'production';
      if (!merchantTxnId) {
        setStatus('failed');
        setMessage('Missing transaction reference.');
        return;
      }
      const verifyNps = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('nps-verify', {
            body: { merchant_txn_id: merchantTxnId, mode },
          });
          if (error) {
            setStatus('failed');
            setMessage('Payment verification failed. Please contact support.');
            return;
          }
          if (data.status === 'completed') {
            setStatus('completed');
            setMessage('Payment successful! Your order has been placed.');
            clearCart();
          } else if (data.status === 'pending') {
            setStatus('failed');
            setMessage('Payment is still pending. Please refresh in a moment or contact support.');
          } else {
            setStatus('failed');
            setMessage(`Payment ${data.status || 'failed'}. Please try again or contact support.`);
          }
        } catch {
          setStatus('failed');
          setMessage('Something went wrong. Please contact support.');
        }
      };
      verifyNps();
      return;
    }

    // Khalti flow
    const pidx = searchParams.get('pidx');
    if (!pidx) {
      setStatus('failed');
      setMessage('Invalid payment verification link.');
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('khalti-verify', {
          body: { pidx },
        });

        if (error) {
          setStatus('failed');
          setMessage('Payment verification failed. Please contact support.');
          return;
        }

        if (data.status === 'completed') {
          setStatus('completed');
          setMessage('Payment successful! Your order has been placed.');
          clearCart();
        } else {
          setStatus('failed');
          setMessage(`Payment ${data.status || 'failed'}. Please try again or contact support.`);
        }
      } catch {
        setStatus('failed');
        setMessage('Something went wrong. Please contact support.');
      }
    };

    verify();
  }, [searchParams, clearCart]);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="h-16 w-16 mx-auto text-primary mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{message}</h1>
          <p className="text-muted-foreground">Please wait, do not close this page.</p>
        </>
      )}
      {status === 'completed' && (
        <>
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{message}</h1>
          <p className="text-muted-foreground mb-6">You can track your order from the dashboard.</p>
          <Button asChild><Link to="/dashboard/orders">View Orders</Link></Button>
        </>
      )}
      {status === 'failed' && (
        <>
          <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{message}</h1>
          <p className="text-muted-foreground mb-6">Your cart items are still saved.</p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline"><Link to="/cart">Back to Cart</Link></Button>
            <Button asChild><Link to="/dashboard/orders">View Orders</Link></Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentVerify;
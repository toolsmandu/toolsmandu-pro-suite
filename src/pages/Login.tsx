import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const RESEND_COOLDOWN = 30;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const navigate = useNavigate();
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('*');
      return data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string | null>) || {};
    },
  });

  useEffect(() => {
    return () => {
      if (resendTimer.current) clearInterval(resendTimer.current);
    };
  }, []);

  const startResendCooldown = () => {
    setResendIn(RESEND_COOLDOWN);
    if (resendTimer.current) clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          if (resendTimer.current) clearInterval(resendTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const isEmailNotConfirmed = (err: { message?: string; code?: string } | null) => {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    return err.code === 'email_not_confirmed' || msg.includes('email not confirmed') || msg.includes('not confirmed');
  };

  const sendVerificationOtp = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    return error;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      if (isEmailNotConfirmed(error)) {
        // Send OTP and switch to verify step
        const resendError = await sendVerificationOtp();
        if (resendError) {
          toast.error(resendError.message);
        } else {
          toast.info('Please verify your email. We sent a 6-digit code.');
          setStep('verify');
          setOtp('');
          startResendCooldown();
        }
      } else {
        toast.error(error.message);
      }
    } else if (signInData.user) {
      const { data: profile } = await supabase.from('profiles').select('is_suspended').eq('user_id', signInData.user.id).single();
      if (profile?.is_suspended) {
        await supabase.auth.signOut();
        toast.error('Your account is suspended, please contact Support team.');
      } else {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', signInData.user.id);
        const isStaff = roles?.some(r => r.role === 'admin' || r.role === 'editor');
        toast.success('Welcome back!');
        navigate(isStaff ? '/admin' : '/dashboard/orders');
      }
    }
    setLoading(false);
  };

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'signup',
    });
    if (error) {
      toast.error(error.message || 'Invalid or expired code');
      setOtp('');
      setVerifying(false);
      return;
    }
    // After verification, sign in with the password they already entered
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setVerifying(false);
    if (signInError || !signInData.user) {
      toast.success('Email verified! Please sign in.');
      setStep('login');
      return;
    }
    toast.success('Email verified! Welcome.');
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', signInData.user.id);
    const isStaff = roles?.some(r => r.role === 'admin' || r.role === 'editor');
    navigate(isStaff ? '/admin' : '/dashboard/orders');
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setResending(true);
    const error = await sendVerificationOtp();
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('A new OTP has been sent');
    startResendCooldown();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Toolsmandu" className="h-8 mx-auto object-contain" />
            ) : (
              <><span className="text-primary">Tools</span>mandu</>
            )}
          </CardTitle>
          <CardDescription>
            {step === 'login' ? 'Sign in to your account' : 'Verify your email to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'login' && (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              <div className="flex items-center justify-between mt-4">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
              </p>
            </>
          )}

          {step === 'verify' && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your email isn't verified yet. We sent a 6-digit code to<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (val.length === 6) handleVerify(val);
                  }}
                  disabled={verifying}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              )}

              <Button type="button" className="w-full" disabled={verifying || otp.length !== 6} onClick={() => handleVerify(otp)}>
                Verify & Sign In
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendIn > 0 || resending}
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resending ? 'Sending...' : resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('login'); setOtp(''); }}
                className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Didn't receive it? Check your spam folder.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Eye, EyeOff, Check, Mail, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const countryCodes = [
  { code: '+977', label: '🇳🇵 +977' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+81', label: '🇯🇵 +81' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+82', label: '🇰🇷 +82' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' },
  { code: '+63', label: '🇵🇭 +63' },
  { code: '+62', label: '🇮🇩 +62' },
  { code: '+55', label: '🇧🇷 +55' },
  { code: '+234', label: '🇳🇬 +234' },
  { code: '+27', label: '🇿🇦 +27' },
  { code: '+254', label: '🇰🇪 +254' },
];

const steps = [
  { label: 'Sign Up', icon: UserPlus },
  { label: 'Verify Email', icon: Mail },
  { label: 'Ready to Login', icon: LogIn },
];

const RESEND_COOLDOWN = 30;

const Signup = () => {
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+977');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (phone.trim() === '') {
      toast.error('Phone number is required');
      return;
    }
    if (/\s/.test(phone)) {
      toast.error('Phone number cannot contain spaces');
      return;
    }
    if (/^[+]/.test(phone)) {
      toast.error('Do not include country code (+) in the phone number — it is already selected');
      return;
    }
    if (/[^0-9]/.test(phone)) {
      toast.error('Phone number can only contain digits (0–9)');
      return;
    }
    if (phone.length < 6) {
      toast.error(`Phone number is too short (${phone.length} digits). It must be at least 6 digits.`);
      return;
    }
    if (phone.length > 15) {
      toast.error(`Phone number is too long (${phone.length} digits). It must be at most 15 digits.`);
      return;
    }

    setLoading(true);
    const fullPhone = `${countryCode}${phone}`;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { phone: fullPhone },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setCurrentStep(1);
    setOtp('');
    startResendCooldown();
    toast.success('OTP sent to your email');
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
    setVerifying(false);
    setCurrentStep(2);
    toast.success('Email verified! Logging you in...');
    setTimeout(() => navigate('/'), 1200);
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
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
            {currentStep === 0 && 'Create your account'}
            {currentStep === 1 && 'Enter the 6-digit code sent to your email'}
            {currentStep === 2 && 'Your account is verified!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stepper */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <div key={step.label} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (
                    <div
                      className={`absolute top-4 -left-1/2 w-full h-0.5 ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      }`}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-xs mt-1.5 text-center ${
                      isCompleted || isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step 0: Signup Form */}
          {currentStep === 0 && (
            <>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9812345678" className="flex-1" required />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Enter your WhatsApp registered number</p>
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
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
              </p>
            </>
          )}

          {/* Step 1: Verify OTP */}
          {currentStep === 1 && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to<br />
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

              <Button
                type="button"
                className="w-full"
                disabled={verifying || otp.length !== 6}
                onClick={() => handleVerify(otp)}
              >
                Verify & Continue
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendIn > 0 || resending}
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resending
                    ? 'Sending...'
                    : resendIn > 0
                    ? `Resend OTP in ${resendIn}s`
                    : 'Resend OTP'}
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Didn't receive it? Check your spam folder.
              </p>
            </div>
          )}

          {/* Step 2: Done */}
          {currentStep === 2 && (
            <div className="text-center space-y-4 py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Account verified!</h3>
              <p className="text-sm text-muted-foreground">Redirecting you...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;

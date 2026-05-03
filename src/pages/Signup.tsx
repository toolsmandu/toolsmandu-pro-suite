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
  { code: '+93', label: '🇦🇫 +93 Afghanistan', min: 9, max: 9 },
  { code: '+355', label: '🇦🇱 +355 Albania', min: 9, max: 9 },
  { code: '+213', label: '🇩🇿 +213 Algeria', min: 9, max: 9 },
  { code: '+376', label: '🇦🇩 +376 Andorra', min: 6, max: 9 },
  { code: '+244', label: '🇦🇴 +244 Angola', min: 9, max: 9 },
  { code: '+54', label: '🇦🇷 +54 Argentina', min: 10, max: 11 },
  { code: '+374', label: '🇦🇲 +374 Armenia', min: 8, max: 8 },
  { code: '+61', label: '🇦🇺 +61 Australia', min: 9, max: 9 },
  { code: '+43', label: '🇦🇹 +43 Austria', min: 10, max: 13 },
  { code: '+994', label: '🇦🇿 +994 Azerbaijan', min: 9, max: 9 },
  { code: '+973', label: '🇧🇭 +973 Bahrain', min: 8, max: 8 },
  { code: '+880', label: '🇧🇩 +880 Bangladesh', min: 10, max: 10 },
  { code: '+375', label: '🇧🇾 +375 Belarus', min: 9, max: 9 },
  { code: '+32', label: '🇧🇪 +32 Belgium', min: 9, max: 9 },
  { code: '+501', label: '🇧🇿 +501 Belize', min: 7, max: 7 },
  { code: '+229', label: '🇧🇯 +229 Benin', min: 8, max: 8 },
  { code: '+975', label: '🇧🇹 +975 Bhutan', min: 8, max: 8 },
  { code: '+591', label: '🇧🇴 +591 Bolivia', min: 8, max: 8 },
  { code: '+387', label: '🇧🇦 +387 Bosnia and Herzegovina', min: 8, max: 8 },
  { code: '+267', label: '🇧🇼 +267 Botswana', min: 8, max: 8 },
  { code: '+55', label: '🇧🇷 +55 Brazil', min: 10, max: 11 },
  { code: '+673', label: '🇧🇳 +673 Brunei', min: 7, max: 7 },
  { code: '+359', label: '🇧🇬 +359 Bulgaria', min: 9, max: 9 },
  { code: '+226', label: '🇧🇫 +226 Burkina Faso', min: 8, max: 8 },
  { code: '+257', label: '🇧🇮 +257 Burundi', min: 8, max: 8 },
  { code: '+855', label: '🇰🇭 +855 Cambodia', min: 8, max: 9 },
  { code: '+237', label: '🇨🇲 +237 Cameroon', min: 9, max: 9 },
  { code: '+1', label: '🇨🇦 +1 Canada', min: 10, max: 10 },
  { code: '+238', label: '🇨🇻 +238 Cape Verde', min: 7, max: 7 },
  { code: '+236', label: '🇨🇫 +236 Central African Republic', min: 8, max: 8 },
  { code: '+235', label: '🇹🇩 +235 Chad', min: 8, max: 8 },
  { code: '+56', label: '🇨🇱 +56 Chile', min: 9, max: 9 },
  { code: '+86', label: '🇨🇳 +86 China', min: 11, max: 11 },
  { code: '+57', label: '🇨🇴 +57 Colombia', min: 10, max: 10 },
  { code: '+269', label: '🇰🇲 +269 Comoros', min: 7, max: 7 },
  { code: '+242', label: '🇨🇬 +242 Congo', min: 9, max: 9 },
  { code: '+243', label: '🇨🇩 +243 Congo (DRC)', min: 9, max: 9 },
  { code: '+506', label: '🇨🇷 +506 Costa Rica', min: 8, max: 8 },
  { code: '+225', label: '🇨🇮 +225 Côte d\'Ivoire', min: 10, max: 10 },
  { code: '+385', label: '🇭🇷 +385 Croatia', min: 8, max: 9 },
  { code: '+53', label: '🇨🇺 +53 Cuba', min: 8, max: 8 },
  { code: '+357', label: '🇨🇾 +357 Cyprus', min: 8, max: 8 },
  { code: '+420', label: '🇨🇿 +420 Czech Republic', min: 9, max: 9 },
  { code: '+45', label: '🇩🇰 +45 Denmark', min: 8, max: 8 },
  { code: '+253', label: '🇩🇯 +253 Djibouti', min: 6, max: 6 },
  { code: '+593', label: '🇪🇨 +593 Ecuador', min: 9, max: 9 },
  { code: '+20', label: '🇪🇬 +20 Egypt', min: 10, max: 10 },
  { code: '+503', label: '🇸🇻 +503 El Salvador', min: 8, max: 8 },
  { code: '+240', label: '🇬🇶 +240 Equatorial Guinea', min: 9, max: 9 },
  { code: '+291', label: '🇪🇷 +291 Eritrea', min: 7, max: 7 },
  { code: '+372', label: '🇪🇪 +372 Estonia', min: 7, max: 8 },
  { code: '+251', label: '🇪🇹 +251 Ethiopia', min: 9, max: 9 },
  { code: '+679', label: '🇫🇯 +679 Fiji', min: 7, max: 7 },
  { code: '+358', label: '🇫🇮 +358 Finland', min: 9, max: 10 },
  { code: '+33', label: '🇫🇷 +33 France', min: 9, max: 9 },
  { code: '+241', label: '🇬🇦 +241 Gabon', min: 7, max: 8 },
  { code: '+220', label: '🇬🇲 +220 Gambia', min: 7, max: 7 },
  { code: '+995', label: '🇬🇪 +995 Georgia', min: 9, max: 9 },
  { code: '+49', label: '🇩🇪 +49 Germany', min: 10, max: 11 },
  { code: '+233', label: '🇬🇭 +233 Ghana', min: 9, max: 9 },
  { code: '+30', label: '🇬🇷 +30 Greece', min: 10, max: 10 },
  { code: '+502', label: '🇬🇹 +502 Guatemala', min: 8, max: 8 },
  { code: '+224', label: '🇬🇳 +224 Guinea', min: 9, max: 9 },
  { code: '+592', label: '🇬🇾 +592 Guyana', min: 7, max: 7 },
  { code: '+509', label: '🇭🇹 +509 Haiti', min: 8, max: 8 },
  { code: '+504', label: '🇭🇳 +504 Honduras', min: 8, max: 8 },
  { code: '+852', label: '🇭🇰 +852 Hong Kong', min: 8, max: 8 },
  { code: '+36', label: '🇭🇺 +36 Hungary', min: 8, max: 9 },
  { code: '+354', label: '🇮🇸 +354 Iceland', min: 7, max: 7 },
  { code: '+91', label: '🇮🇳 +91 India', min: 10, max: 10 },
  { code: '+62', label: '🇮🇩 +62 Indonesia', min: 9, max: 12 },
  { code: '+98', label: '🇮🇷 +98 Iran', min: 10, max: 10 },
  { code: '+964', label: '🇮🇶 +964 Iraq', min: 10, max: 10 },
  { code: '+353', label: '🇮🇪 +353 Ireland', min: 9, max: 9 },
  { code: '+972', label: '🇮🇱 +972 Israel', min: 9, max: 9 },
  { code: '+39', label: '🇮🇹 +39 Italy', min: 9, max: 11 },
  { code: '+81', label: '🇯🇵 +81 Japan', min: 10, max: 11 },
  { code: '+962', label: '🇯🇴 +962 Jordan', min: 9, max: 9 },
  { code: '+7', label: '🇰🇿 +7 Kazakhstan', min: 10, max: 10 },
  { code: '+254', label: '🇰🇪 +254 Kenya', min: 9, max: 10 },
  { code: '+965', label: '🇰🇼 +965 Kuwait', min: 8, max: 8 },
  { code: '+996', label: '🇰🇬 +996 Kyrgyzstan', min: 9, max: 9 },
  { code: '+856', label: '🇱🇦 +856 Laos', min: 8, max: 10 },
  { code: '+371', label: '🇱🇻 +371 Latvia', min: 8, max: 8 },
  { code: '+961', label: '🇱🇧 +961 Lebanon', min: 7, max: 8 },
  { code: '+266', label: '🇱🇸 +266 Lesotho', min: 8, max: 8 },
  { code: '+231', label: '🇱🇷 +231 Liberia', min: 7, max: 8 },
  { code: '+218', label: '🇱🇾 +218 Libya', min: 9, max: 10 },
  { code: '+423', label: '🇱🇮 +423 Liechtenstein', min: 7, max: 7 },
  { code: '+370', label: '🇱🇹 +370 Lithuania', min: 8, max: 8 },
  { code: '+352', label: '🇱🇺 +352 Luxembourg', min: 9, max: 9 },
  { code: '+853', label: '🇲🇴 +853 Macau', min: 8, max: 8 },
  { code: '+389', label: '🇲🇰 +389 Macedonia', min: 8, max: 8 },
  { code: '+261', label: '🇲🇬 +261 Madagascar', min: 9, max: 9 },
  { code: '+265', label: '🇲🇼 +265 Malawi', min: 9, max: 9 },
  { code: '+60', label: '🇲🇾 +60 Malaysia', min: 9, max: 10 },
  { code: '+960', label: '🇲🇻 +960 Maldives', min: 7, max: 7 },
  { code: '+223', label: '🇲🇱 +223 Mali', min: 8, max: 8 },
  { code: '+356', label: '🇲🇹 +356 Malta', min: 8, max: 8 },
  { code: '+222', label: '🇲🇷 +222 Mauritania', min: 8, max: 8 },
  { code: '+230', label: '🇲🇺 +230 Mauritius', min: 7, max: 8 },
  { code: '+52', label: '🇲🇽 +52 Mexico', min: 10, max: 10 },
  { code: '+373', label: '🇲🇩 +373 Moldova', min: 8, max: 8 },
  { code: '+377', label: '🇲🇨 +377 Monaco', min: 8, max: 9 },
  { code: '+976', label: '🇲🇳 +976 Mongolia', min: 8, max: 8 },
  { code: '+382', label: '🇲🇪 +382 Montenegro', min: 8, max: 9 },
  { code: '+212', label: '🇲🇦 +212 Morocco', min: 9, max: 9 },
  { code: '+258', label: '🇲🇿 +258 Mozambique', min: 9, max: 9 },
  { code: '+95', label: '🇲🇲 +95 Myanmar', min: 8, max: 10 },
  { code: '+264', label: '🇳🇦 +264 Namibia', min: 9, max: 10 },
  { code: '+977', label: '🇳🇵 +977 Nepal', min: 10, max: 10 },
  { code: '+31', label: '🇳🇱 +31 Netherlands', min: 9, max: 9 },
  { code: '+64', label: '🇳🇿 +64 New Zealand', min: 8, max: 10 },
  { code: '+505', label: '🇳🇮 +505 Nicaragua', min: 8, max: 8 },
  { code: '+227', label: '🇳🇪 +227 Niger', min: 8, max: 8 },
  { code: '+234', label: '🇳🇬 +234 Nigeria', min: 10, max: 10 },
  { code: '+850', label: '🇰🇵 +850 North Korea', min: 8, max: 10 },
  { code: '+47', label: '🇳🇴 +47 Norway', min: 8, max: 8 },
  { code: '+968', label: '🇴🇲 +968 Oman', min: 8, max: 8 },
  { code: '+92', label: '🇵🇰 +92 Pakistan', min: 10, max: 10 },
  { code: '+970', label: '🇵🇸 +970 Palestine', min: 9, max: 9 },
  { code: '+507', label: '🇵🇦 +507 Panama', min: 8, max: 8 },
  { code: '+675', label: '🇵🇬 +675 Papua New Guinea', min: 8, max: 8 },
  { code: '+595', label: '🇵🇾 +595 Paraguay', min: 9, max: 9 },
  { code: '+51', label: '🇵🇪 +51 Peru', min: 9, max: 9 },
  { code: '+63', label: '🇵🇭 +63 Philippines', min: 10, max: 10 },
  { code: '+48', label: '🇵🇱 +48 Poland', min: 9, max: 9 },
  { code: '+351', label: '🇵🇹 +351 Portugal', min: 9, max: 9 },
  { code: '+974', label: '🇶🇦 +974 Qatar', min: 8, max: 8 },
  { code: '+40', label: '🇷🇴 +40 Romania', min: 9, max: 9 },
  { code: '+7', label: '🇷🇺 +7 Russia', min: 10, max: 10 },
  { code: '+250', label: '🇷🇼 +250 Rwanda', min: 9, max: 9 },
  { code: '+966', label: '🇸🇦 +966 Saudi Arabia', min: 9, max: 9 },
  { code: '+221', label: '🇸🇳 +221 Senegal', min: 9, max: 9 },
  { code: '+381', label: '🇷🇸 +381 Serbia', min: 8, max: 9 },
  { code: '+232', label: '🇸🇱 +232 Sierra Leone', min: 8, max: 8 },
  { code: '+65', label: '🇸🇬 +65 Singapore', min: 8, max: 8 },
  { code: '+421', label: '🇸🇰 +421 Slovakia', min: 9, max: 9 },
  { code: '+386', label: '🇸🇮 +386 Slovenia', min: 8, max: 8 },
  { code: '+252', label: '🇸🇴 +252 Somalia', min: 7, max: 8 },
  { code: '+27', label: '🇿🇦 +27 South Africa', min: 9, max: 9 },
  { code: '+82', label: '🇰🇷 +82 South Korea', min: 9, max: 10 },
  { code: '+211', label: '🇸🇸 +211 South Sudan', min: 9, max: 9 },
  { code: '+34', label: '🇪🇸 +34 Spain', min: 9, max: 9 },
  { code: '+94', label: '🇱🇰 +94 Sri Lanka', min: 9, max: 9 },
  { code: '+249', label: '🇸🇩 +249 Sudan', min: 9, max: 9 },
  { code: '+597', label: '🇸🇷 +597 Suriname', min: 6, max: 7 },
  { code: '+46', label: '🇸🇪 +46 Sweden', min: 9, max: 10 },
  { code: '+41', label: '🇨🇭 +41 Switzerland', min: 9, max: 9 },
  { code: '+963', label: '🇸🇾 +963 Syria', min: 9, max: 9 },
  { code: '+886', label: '🇹🇼 +886 Taiwan', min: 9, max: 9 },
  { code: '+992', label: '🇹🇯 +992 Tajikistan', min: 9, max: 9 },
  { code: '+255', label: '🇹🇿 +255 Tanzania', min: 9, max: 9 },
  { code: '+66', label: '🇹🇭 +66 Thailand', min: 9, max: 9 },
  { code: '+228', label: '🇹🇬 +228 Togo', min: 8, max: 8 },
  { code: '+216', label: '🇹🇳 +216 Tunisia', min: 8, max: 8 },
  { code: '+90', label: '🇹🇷 +90 Turkey', min: 10, max: 10 },
  { code: '+993', label: '🇹🇲 +993 Turkmenistan', min: 8, max: 8 },
  { code: '+256', label: '🇺🇬 +256 Uganda', min: 9, max: 9 },
  { code: '+380', label: '🇺🇦 +380 Ukraine', min: 9, max: 9 },
  { code: '+971', label: '🇦🇪 +971 United Arab Emirates', min: 9, max: 9 },
  { code: '+44', label: '🇬🇧 +44 United Kingdom', min: 10, max: 10 },
  { code: '+1', label: '🇺🇸 +1 United States', min: 10, max: 10 },
  { code: '+598', label: '🇺🇾 +598 Uruguay', min: 8, max: 8 },
  { code: '+998', label: '🇺🇿 +998 Uzbekistan', min: 9, max: 9 },
  { code: '+58', label: '🇻🇪 +58 Venezuela', min: 10, max: 10 },
  { code: '+84', label: '🇻🇳 +84 Vietnam', min: 9, max: 10 },
  { code: '+967', label: '🇾🇪 +967 Yemen', min: 9, max: 9 },
  { code: '+260', label: '🇿🇲 +260 Zambia', min: 9, max: 9 },
  { code: '+263', label: '🇿🇼 +263 Zimbabwe', min: 9, max: 10 },
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
    const cc = countryCodes.find(c => c.code === countryCode);
    const min = cc?.min ?? 6;
    const max = cc?.max ?? 15;
    if (phone.length < min || phone.length > max) {
      const expected = min === max ? `${min} digits` : `${min}–${max} digits`;
      toast.error(`Phone number for ${countryCode} must be ${expected}. You entered ${phone.length} digits.`);
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
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('phone')) {
        toast.error('Invalid Phone Number. Do not include country code, spaces and special characters. Only type Digits.');
      } else {
        toast.error(error.message);
      }
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
                      <SelectTrigger className="w-[140px]">
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

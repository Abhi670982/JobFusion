'use client';

import { useState, useEffect } from 'react';
import { useSignUp, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Lock, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { mapSignUpError } from '@/lib/auth-errors';
import {
  validateFirstName,
  validateLastName,
  validateEmailInput,
  validatePasswordInput,
} from '@/lib/auth-validation';

const perks = [
  'Access aggregated job opportunities',
  'AI-powered job matching',
  'One-click applications',
];

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function CustomSignUpPage() {
  const { signUp, fetchStatus } = useSignUp();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
  
  const [dynamicRedirect, setDynamicRedirect] = useState(redirectUrl);

  useEffect(() => {
    const guestSearchStr = sessionStorage.getItem('guestSearch');
    if (guestSearchStr) {
      try {
        const { role, location } = JSON.parse(guestSearchStr);
        setDynamicRedirect(`/jobs?q=${encodeURIComponent(role || '')}&location=${encodeURIComponent(location || '')}`);
      } catch {}
    }
  }, []);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field Validation Errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  
  // Sign up state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Verification state
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [verifyingError, setVerifyingError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  // Live Password Requirements evaluation
  const reqMinLen = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNum = /[0-9]/.test(password);
  const reqSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Redirect if already signed in
  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      router.push(dynamicRedirect);
    }
  }, [isUserLoaded, isSignedIn, router, dynamicRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    // Reset inline errors
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setTermsError('');
    setError('');

    let hasValidationError = false;
    if (!firstName.trim()) {
      setFirstNameError('Please enter your first name.');
      hasValidationError = true;
    }
    if (!lastName.trim()) {
      setLastNameError('Please enter your last name.');
      hasValidationError = true;
    }
    if (!email.trim()) {
      setEmailError('Email is required.');
      hasValidationError = true;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      hasValidationError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasValidationError = true;
    }
    if (!termsAccepted) {
      setTermsError('You must accept the Terms of Service and Privacy Policy.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setLoading(true);

    try {
      const { error: signUpErr } = await signUp.password({
        emailAddress: email.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (signUpErr) {
        setError(mapSignUpError(signUpErr));
        setLoading(false);
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl(dynamicRedirect);
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else if (signUp.status === 'missing_requirements') {
        // Send email code verification
        const { error: sendErr } = await signUp.verifications.sendEmailCode();
        if (sendErr) {
          setError(mapSignUpError(sendErr));
          setLoading(false);
          return;
        }
        setVerifying(true);
      } else {
        setError('Something went wrong. Please try again later.');
      }
    } catch (err: any) {
      console.error('Email sign-up error:', err);
      setError(mapSignUpError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;

    setVerifyingLoading(true);
    setVerifyingError('');
    setResendMessage('');

    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({
        code: code,
      });

      if (verifyErr) {
        setVerifyingError(mapSignUpError(verifyErr));
        setVerifyingLoading(false);
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl(dynamicRedirect);
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        setVerifyingError('Something went wrong. Please try again later.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerifyingError(mapSignUpError(err));
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) return;
    setResendMessage('');
    setVerifyingError('');

    try {
      const { error: resendErr } = await signUp.verifications.sendEmailCode();
      if (resendErr) {
        setVerifyingError(mapSignUpError(resendErr));
        return;
      }
      setResendMessage('A new verification code has been sent.');
    } catch (err: any) {
      console.error('Resend code error:', err);
      setVerifyingError(mapSignUpError(err));
    }
  };

  const handleGoogleSignUp = async () => {
    if (!signUp) return;
    setLoading(true);
    setError('');

    try {
      const { error: ssoErr } = await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: dynamicRedirect,
        redirectCallbackUrl: '/sso-callback',
      });
      if (ssoErr) {
        setError(mapSignUpError(ssoErr));
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      setError(mapSignUpError(err));
      setLoading(false);
    }
  };

  // Back to signup form
  const handleBackToSignUp = () => {
    if (signUp) {
      signUp.reset();
    }
    setVerifying(false);
    setCode('');
    setVerifyingError('');
    setResendMessage('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background lg:h-screen lg:overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between p-6 xl:p-10 gradient-brand relative overflow-hidden h-full">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,white,transparent_60%)]" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <Image
            src="/logo-circle.png"
            alt="JobFusion Logo"
            width={32}
            height={32}
            className="rounded-full object-cover border-[3px] border-white/40 shadow-sm"
          />
          <span className="font-bold text-lg xl:text-xl text-white font-sans">JobFusion</span>
        </Link>

        <div className="relative z-10 space-y-4 xl:space-y-5 my-auto">
          <h2 className="text-xl xl:text-3xl font-extrabold text-white font-sans leading-snug">
            Start your journey to your dream job.
          </h2>
          <div className="space-y-2 xl:space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 xl:w-4.5 xl:h-4.5 text-white/80 flex-shrink-0" />
                <span className="text-white/80 text-xs xl:text-sm font-medium">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-xs xl:text-sm relative z-10">© 2026 JobFusion Inc.</p>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-4 xl:p-8 bg-background h-full lg:overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[370px] xl:max-w-md my-auto py-0"
        >
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-5">
            <Image
              src="/logo-circle.png"
              alt="JobFusion Logo"
              width={32}
              height={32}
              className="rounded-full object-cover border-[3px] border-border/70 shadow-sm"
            />
            <span className="font-bold text-xl gradient-brand-text font-sans">JobFusion</span>
          </Link>

          {!verifying ? (
            // Phase 1: Sign Up Form
            <>
              <div className="mb-3 xl:mb-4">
                <h1 className="text-2xl xl:text-3xl font-bold font-sans">Create your account</h1>
              </div>

              {error && (
                <div className="p-2 mb-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Social login */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-8.5 xl:h-9 rounded-xl mb-2 font-medium text-xs transition-all duration-200 border-border hover:bg-accent cursor-pointer"
                onClick={handleGoogleSignUp}
                disabled={loading || fetchStatus === 'fetching' || !signUp}
              >
                <GoogleIcon />
                Sign up with Google
              </Button>

              <div className="flex items-center gap-3 my-2 xl:my-2.5">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[10px] xl:text-xs text-muted-foreground uppercase font-semibold">Or email</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-2 xl:space-y-2.5">
                <div className="grid grid-cols-2 gap-2 xl:gap-2.5">
                  <div className="space-y-0.5">
                    <Label htmlFor="fname" className="text-xs">First name</Label>
                    <Input
                      id="fname"
                      placeholder="Alex"
                      maxLength={50}
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (firstNameError) setFirstNameError('');
                      }}
                      className={`rounded-xl h-8 xl:h-8.5 text-xs border-border focus-visible:ring-primary focus-visible:border-primary ${
                        firstNameError ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      disabled={loading}
                    />
                    {firstNameError && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 font-medium">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {firstNameError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="lname" className="text-xs">Last name</Label>
                    <Input
                      id="lname"
                      placeholder="Morgan"
                      maxLength={50}
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (lastNameError) setLastNameError('');
                      }}
                      className={`rounded-xl h-8 xl:h-8.5 text-xs border-border focus-visible:ring-primary focus-visible:border-primary ${
                        lastNameError ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      disabled={loading}
                    />
                    {lastNameError && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 font-medium">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {lastNameError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Label htmlFor="email" className="text-xs">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      maxLength={254}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      className={`pl-8.5 rounded-xl h-8 xl:h-8.5 text-xs border-border focus-visible:ring-primary focus-visible:border-primary ${
                        emailError ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      disabled={loading}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-0.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={show ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      maxLength={128}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      className={`pl-8.5 pr-8.5 rounded-xl h-8 xl:h-8.5 text-xs border-border focus-visible:ring-primary focus-visible:border-primary ${
                        passwordError ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {passwordError}
                    </p>
                  )}

                  {/* ── LIVE PASSWORD REQUIREMENTS CHECKER (ULTRA-COMPACT 2-COLUMN GRID) ── */}
                  <div className="mt-1 p-1.5 px-2.5 rounded-lg bg-accent/40 border border-border/50 text-[10px] xl:text-[11px]">
                    <p className="font-semibold text-muted-foreground mb-0.5 text-[10px]">Password requirements:</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {[
                        { label: 'Min 8 characters', met: reqMinLen },
                        { label: 'One uppercase', met: reqUpper },
                        { label: 'One lowercase', met: reqLower },
                        { label: 'One number', met: reqNum },
                        { label: 'One special char', met: reqSpecial },
                      ].map((req, idx) => (
                        <div key={idx} className={`flex items-center gap-1 transition-colors ${req.met ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
                          {req.met ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 ml-0.5 mr-1 flex-shrink-0" />
                          )}
                          <span className="truncate">{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-start gap-2 pt-0.5">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => {
                        setTermsAccepted(!!checked);
                        if (termsError) setTermsError('');
                      }}
                      disabled={loading}
                      className="w-[18px] h-[18px] p-0 shrink-0 rounded border-border focus-visible:ring-primary data-[state=checked]:bg-primary transition-all duration-200 mt-0.5 flex-shrink-0 appearance-none"
                    />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer select-none">
                      I agree to the <Link href="/terms-of-service" className="text-primary font-semibold hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-primary font-semibold hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                  {termsError && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-0.5 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {termsError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-8.5 xl:h-9 rounded-xl gradient-brand text-white border-0 font-semibold text-xs xl:text-sm hover:opacity-90 shadow-md hover:shadow-lg transition-all mt-0.5"
                  disabled={loading || fetchStatus === 'fetching' || !signUp}
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs xl:text-sm text-muted-foreground mt-2.5 xl:mt-3.5">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-primary font-semibold hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            // Phase 2: OTP Verification
            <>
              <div className="mb-4 xl:mb-5">
                <h1 className="text-2xl xl:text-3xl font-bold mb-1 font-sans">Verify your email</h1>
                <p className="text-xs text-muted-foreground">
                  We sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>. Please enter it below.
                </p>
              </div>

              {verifyingError && (
                <div className="p-2 mb-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{verifyingError}</span>
                </div>
              )}

              {resendMessage && (
                <div className="p-2 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{resendMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="code" className="text-xs">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-center text-lg tracking-widest rounded-xl h-9 xl:h-9.5 border-border focus-visible:ring-primary focus-visible:border-primary font-mono font-semibold"
                    required
                    disabled={verifyingLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-8.5 xl:h-9 rounded-xl gradient-brand text-white border-0 font-semibold text-xs xl:text-sm hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                  disabled={verifyingLoading || code.length < 6}
                >
                  {verifyingLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex flex-col gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-xs font-semibold text-primary hover:underline focus:outline-none"
                  disabled={verifyingLoading}
                >
                  I need a new code
                </button>
                
                <button
                  type="button"
                  onClick={handleBackToSignUp}
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none mt-1"
                  disabled={verifyingLoading}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign Up
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

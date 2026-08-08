'use client';

import { useState, useEffect } from 'react';
import { useSignIn, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Lock, Mail, CheckCircle2, AlertCircle, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { mapSignInError } from '@/lib/auth-errors';
import { validateEmailInput, validatePasswordInput } from '@/lib/auth-validation';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function CustomSignInPage() {
  const { signIn, fetchStatus } = useSignIn();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
  
  const [dynamicRedirect, setDynamicRedirect] = useState(redirectUrl);

  useEffect(() => {
    const explicitRedirect = searchParams.get('redirect_url');
    if (!explicitRedirect) {
      const guestSearchStr = sessionStorage.getItem('guestSearch');
      if (guestSearchStr) {
        try {
          const { role, location } = JSON.parse(guestSearchStr);
          setDynamicRedirect(`/jobs?q=${encodeURIComponent(role || '')}&location=${encodeURIComponent(location || '')}`);
        } catch {}
      }
    }
  }, [searchParams]);

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Required Field Validation Errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Lockout / Brute force state
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Verification step state (for needs_client_trust / needs_second_factor)
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone' | 'totp'>('email');

  // Load initial Remember Me preference and check existing Lockout on mount
  useEffect(() => {
    const savedRemember = localStorage.getItem('jf_remember_me');
    if (savedRemember === 'true') {
      setRememberMe(true);
    }

    const checkLockout = () => {
      const untilStr = localStorage.getItem('jf_lockout_until');
      if (untilStr) {
        const until = parseInt(untilStr, 10);
        const now = Date.now();
        if (until > now) {
          const diff = Math.ceil((until - now) / 1000);
          setIsLockedOut(true);
          setLockoutRemaining(diff);
        } else {
          setIsLockedOut(false);
          setLockoutRemaining(0);
          localStorage.removeItem('jf_lockout_until');
          localStorage.removeItem('jf_failed_login_attempts');
        }
      }
    };

    checkLockout();
  }, []);

  // Timer interval for Lockout countdown
  useEffect(() => {
    if (!isLockedOut) return;

    const interval = setInterval(() => {
      const untilStr = localStorage.getItem('jf_lockout_until');
      if (!untilStr) {
        setIsLockedOut(false);
        setLockoutRemaining(0);
        return;
      }
      const until = parseInt(untilStr, 10);
      const now = Date.now();
      const remaining = Math.ceil((until - now) / 1000);

      if (remaining <= 0) {
        setIsLockedOut(false);
        setLockoutRemaining(0);
        localStorage.removeItem('jf_lockout_until');
        localStorage.removeItem('jf_failed_login_attempts');
        clearInterval(interval);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut]);

  // Handle failed login attempt tracking
  const handleFailedAttempt = () => {
    const current = parseInt(localStorage.getItem('jf_failed_login_attempts') || '0', 10) + 1;
    localStorage.setItem('jf_failed_login_attempts', String(current));

    if (current >= 8) {
      const lockoutUntil = Date.now() + 30000; // 30 seconds lockout
      localStorage.setItem('jf_lockout_until', String(lockoutUntil));
      setIsLockedOut(true);
      setLockoutRemaining(30);
    }
  };

  // Clear failed attempt tracking on success
  const handleSuccessfulAuth = () => {
    localStorage.removeItem('jf_failed_login_attempts');
    localStorage.removeItem('jf_lockout_until');
    if (rememberMe) {
      localStorage.setItem('jf_remember_me', 'true');
    } else {
      localStorage.removeItem('jf_remember_me');
    }
  };

  // Redirect if already signed in
  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      router.push(dynamicRedirect);
    }
  }, [isUserLoaded, isSignedIn, router, dynamicRedirect]);

  // Helper to finalize sign-in and navigate
  const finalizeAndNavigate = async () => {
    if (!signIn) return;
    handleSuccessfulAuth();
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          const url = decorateUrl(`/sign-in/tasks/${session.currentTask.key}`);
          if (url.startsWith('http')) {
            window.location.href = url;
          } else {
            router.push(url);
          }
          return;
        }
        const url = decorateUrl(dynamicRedirect);
        if (url.startsWith('http')) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  };

  // Handle post-authentication status
  const handlePostAuthStatus = async () => {
    if (!signIn) return;

    if (signIn.status === 'complete') {
      await finalizeAndNavigate();
      return;
    }

    // New device trust or MFA required — need a verification code
    if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      // Try to send an email verification code first
      try {
        await signIn.mfa.sendEmailCode();
        setVerificationMethod('email');
      } catch {
        // If email code isn't available, try phone
        try {
          await signIn.mfa.sendPhoneCode();
          setVerificationMethod('phone');
        } catch {
          // Fallback to TOTP (authenticator app) — user enters code from app
          setVerificationMethod('totp');
        }
      }
      setVerificationStep(true);
      setLoading(false);
      return;
    }

    // Unexpected status
    setError(`Sign in requires additional steps (status: ${signIn.status}). Please try again.`);
    handleFailedAttempt();
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!signIn || isLockedOut) return;
    setLoading(true);
    setError('');

    try {
      const { error: ssoErr } = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: dynamicRedirect,
        redirectCallbackUrl: '/sso-callback',
      });
      if (ssoErr) {
        setError(mapSignInError(ssoErr));
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(mapSignInError(err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || isLockedOut) return;

    // Reset inline field errors
    setEmailError('');
    setPasswordError('');
    setError('');

    let hasValidationError = false;
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

    if (hasValidationError) {
      return;
    }

    const emailVal = validateEmailInput(email, true);
    if (!emailVal.isValid) {
      setError(emailVal.error || 'The email or password you entered is incorrect.');
      return;
    }

    const passVal = validatePasswordInput(password, true);
    if (!passVal.isValid) {
      setError(passVal.error || 'The email or password you entered is incorrect.');
      return;
    }

    setLoading(true);

    try {
      const { error: signInErr } = await signIn.password({
        identifier: email.trim(),
        password: password,
      });

      if (signInErr) {
        setError(signInErr.message || 'Invalid email or password.');
        handleFailedAttempt();
        setLoading(false);
        return;
      }

      await handlePostAuthStatus();
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      setError(err.message || 'An unexpected error occurred.');
      handleFailedAttempt();
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;

    setLoading(true);
    setError('');

    try {
      let verifyResult;
      if (verificationMethod === 'totp') {
        verifyResult = await signIn.mfa.verifyTOTP({ code: verificationCode });
      } else if (verificationMethod === 'phone') {
        verifyResult = await signIn.mfa.verifyPhoneCode({ code: verificationCode });
      } else {
        verifyResult = await signIn.mfa.verifyEmailCode({ code: verificationCode });
      }

      if (verifyResult?.error) {
        setError(verifyResult.error.message || 'Invalid verification code.');
        setLoading(false);
        return;
      }

      if (signIn.status === 'complete') {
        await finalizeAndNavigate();
      } else {
        setError('Verification succeeded but sign-in is not yet complete. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed.');
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!signIn) return;
    setError('');
    try {
      if (verificationMethod === 'phone') {
        await signIn.mfa.sendPhoneCode();
      } else if (verificationMethod === 'email') {
        await signIn.mfa.sendEmailCode();
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background lg:h-screen lg:overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between p-6 xl:p-10 gradient-brand relative overflow-hidden h-full">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,white,transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

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

        <div className="relative z-10 space-y-6 xl:space-y-8 my-auto">
          <div>
            <h2 className="text-2xl xl:text-4xl font-extrabold text-white mb-2 xl:mb-3 font-sans leading-tight">
              Your next great opportunity awaits.
            </h2>
            <p className="text-white/75 text-sm xl:text-base">Find matching positions powered by resume parsing and real-time job aggregation.</p>
          </div>
          <div className="space-y-3.5 xl:space-y-5 text-white/90">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4.5 h-4.5 xl:w-5 xl:h-5 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white text-sm xl:text-base">Gemini AI Sourced Matches</h4>
                <p className="text-white/70 text-xs xl:text-sm">Direct resume-to-job matching based on actual skills and experience.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4.5 h-4.5 xl:w-5 xl:h-5 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white text-sm xl:text-base">Unified Sourcing</h4>
                <p className="text-white/70 text-xs xl:text-sm">Aggregated openings from leading portals in one clean search dashboard.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4.5 h-4.5 xl:w-5 xl:h-5 text-white mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white text-sm xl:text-base">Privacy Focused</h4>
                <p className="text-white/70 text-xs xl:text-sm">No public profiling. Your job applications and search history remain confidential.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-xs xl:text-sm relative z-10">© 2026 JobFusion Inc.</p>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-4 xl:p-8 bg-background h-full lg:overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[380px] xl:max-w-md my-auto"
        >
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-6">
            <Image
              src="/logo-circle.png"
              alt="JobFusion Logo"
              width={32}
              height={32}
              className="rounded-full object-cover border-[3px] border-border/70 shadow-sm"
            />
            <span className="font-bold text-xl gradient-brand-text font-sans">JobFusion</span>
          </Link>

          {/* ── VERIFICATION CODE STEP ── */}
          {verificationStep ? (
            <>
              <div className="mb-5 xl:mb-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-5 h-5 xl:w-6 xl:h-6 text-primary" />
                  <h1 className="text-2xl xl:text-3xl font-bold font-sans">Verify your identity</h1>
                </div>
                <p className="text-xs xl:text-sm text-muted-foreground">
                  {verificationMethod === 'totp'
                    ? 'Enter the 6-digit code from your authenticator app.'
                    : `We sent a verification code to your ${verificationMethod === 'email' ? 'email address' : 'phone number'}. Enter it below to complete sign-in.`
                  }
                </p>
              </div>

              {error && (
                <div className="p-2.5 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs xl:text-sm flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="verification-code" className="text-xs xl:text-sm">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="rounded-xl h-10 xl:h-11 text-center text-base xl:text-lg tracking-[0.3em] font-mono border-border focus-visible:ring-primary focus-visible:border-primary"
                    required
                    maxLength={6}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-9.5 xl:h-10 rounded-xl gradient-brand text-white border-0 font-semibold text-xs xl:text-sm hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                  disabled={loading || !verificationCode || verificationCode.length < 6}
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {verificationMethod !== 'totp' && (
                <p className="text-center text-xs xl:text-sm text-muted-foreground mt-3">
                  Didn&apos;t receive a code?{' '}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-primary font-semibold hover:underline"
                  >
                    Resend code
                  </button>
                </p>
              )}

              <p className="text-center text-xs xl:text-sm text-muted-foreground mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationStep(false);
                    setVerificationCode('');
                    setError('');
                    signIn?.reset();
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  ← Back to sign in
                </button>
              </p>
            </>
          ) : (
            /* ── MAIN SIGN-IN FORM ── */
            <>
              <div className="mb-5 xl:mb-6">
                <h1 className="text-2xl xl:text-3xl font-bold mb-1 xl:mb-1.5 font-sans">Welcome back</h1>
                <p className="text-xs xl:text-sm text-muted-foreground">Sign in to your account to continue</p>
              </div>

              {/* ── BRUTE FORCE LOCKOUT NOTIFICATION CARD ── */}
              {isLockedOut ? (
                <div className="p-3.5 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs xl:text-sm">
                    <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
                    <h2>Too Many Login Attempts</h2>
                  </div>
                  <p className="text-[11px] xl:text-xs text-muted-foreground leading-relaxed">
                    We noticed several unsuccessful sign-in attempts. For your account&apos;s security, login has been temporarily paused for 30 seconds. Please verify your credentials and try again shortly.
                  </p>
                  <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/20 text-[11px] xl:text-xs">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Login Temporarily Paused
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                      {lockoutRemaining}s remaining
                    </span>
                  </div>
                </div>
              ) : error ? (
                <div className="p-2.5 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs xl:text-sm flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {/* Social login */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-9.5 xl:h-10 rounded-xl mb-3 font-medium text-xs xl:text-sm transition-all duration-200 border-border hover:bg-accent cursor-pointer"
                onClick={handleGoogleSignIn}
                disabled={loading || fetchStatus === 'fetching' || !signIn || isLockedOut}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 my-3 xl:my-4">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[10px] xl:text-xs text-muted-foreground uppercase font-semibold">Or email</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3 xl:space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs xl:text-sm">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                      className={`pl-9 rounded-xl h-9.5 xl:h-10 text-xs xl:text-sm border-border focus-visible:ring-primary focus-visible:border-primary ${
                        emailError ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      disabled={loading || isLockedOut}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[11px] xl:text-xs text-destructive flex items-center gap-1 mt-0.5 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs xl:text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={show ? 'text' : 'password'}
                      placeholder="••••••••"
                      maxLength={128}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      className={`pl-9 pr-9 rounded-xl h-9.5 xl:h-10 text-xs xl:text-sm border-border focus-visible:ring-primary focus-visible:border-primary ${
                        passwordError ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      disabled={loading || isLockedOut}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading || isLockedOut}
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-[11px] xl:text-xs text-destructive flex items-center gap-1 mt-0.5 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {passwordError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      disabled={loading || isLockedOut}
                      className="w-4 h-4 p-0 shrink-0 rounded border-border focus-visible:ring-primary data-[state=checked]:bg-primary transition-all duration-200 appearance-none"
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none font-medium">
                      Remember Me
                    </Label>
                  </div>
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9.5 xl:h-10 rounded-xl gradient-brand text-white border-0 font-semibold text-xs xl:text-sm hover:opacity-90 shadow-md hover:shadow-lg transition-all mt-1"
                  disabled={loading || fetchStatus === 'fetching' || !signIn || isLockedOut}
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs xl:text-sm text-muted-foreground mt-4 xl:mt-5">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="text-primary font-semibold hover:underline">Create one free</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}



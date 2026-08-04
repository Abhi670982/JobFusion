'use client';

import { useState, useEffect } from 'react';
import { useSignIn, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Lock, Mail, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    const guestSearchStr = sessionStorage.getItem('guestSearch');
    if (guestSearchStr) {
      try {
        const { role, location } = JSON.parse(guestSearchStr);
        setDynamicRedirect(`/jobs?q=${encodeURIComponent(role || '')}&location=${encodeURIComponent(location || '')}`);
      } catch {}
    }
  }, []);

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verification step state (for needs_client_trust / needs_second_factor)
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone' | 'totp'>('email');

  // Redirect if already signed in
  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      router.push(dynamicRedirect);
    }
  }, [isUserLoaded, isSignedIn, router, dynamicRedirect]);

  // Helper to finalize sign-in and navigate
  const finalizeAndNavigate = async () => {
    if (!signIn) return;
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
          // Fallback to TOTP (authenticator app) — no code to send, user enters from their app
          setVerificationMethod('totp');
        }
      }
      setVerificationStep(true);
      setLoading(false);
      return;
    }

    // Unexpected status
    setError(`Sign in requires additional steps (status: ${signIn.status}). Please try again.`);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!signIn) return;
    setLoading(true);
    setError('');

    try {
      const { error: ssoErr } = await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: dynamicRedirect,
        redirectCallbackUrl: '/sso-callback',
      });
      if (ssoErr) {
        setError(ssoErr.message || 'OAuth error occurred.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'OAuth error occurred.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;

    setLoading(true);
    setError('');

    try {
      const { error: signInErr } = await signIn.password({
        identifier: email,
        password: password,
      });

      if (signInErr) {
        setError(signInErr.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      await handlePostAuthStatus();
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      setError(err.message || 'An unexpected error occurred.');
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,white,transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <Image
            src="/logo-circle.png"
            alt="JobFusion Logo"
            width={36}
            height={36}
            className="rounded-full object-cover border-[3px] border-white/40 shadow-sm"
          />
          <span className="font-bold text-xl text-white font-sans">JobFusion</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-3 font-sans">
              Your next great opportunity awaits.
            </h2>
            <p className="text-white/75 text-lg">Find matching positions powered by resume parsing and real-time job aggregation.</p>
          </div>
          <div className="space-y-5 text-white/90">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-white mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white">Gemini AI Sourced Matches</h4>
                <p className="text-white/70 text-sm">Direct resume-to-job matching based on actual skills and experience.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-white mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white">Unified Sourcing</h4>
                <p className="text-white/70 text-sm">Aggregated openings from leading portals in one clean search dashboard.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-white mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white">Privacy Focused</h4>
                <p className="text-white/70 text-sm">No public profiling. Your job applications and search history remain confidential.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-sm relative z-10">© 2026 JobFusion Inc.</p>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
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
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h1 className="text-3xl font-bold font-sans">Verify your identity</h1>
                </div>
                <p className="text-muted-foreground">
                  {verificationMethod === 'totp'
                    ? 'Enter the 6-digit code from your authenticator app.'
                    : `We sent a verification code to your ${verificationMethod === 'email' ? 'email address' : 'phone number'}. Enter it below to complete sign-in.`
                  }
                </p>
              </div>

              {error && (
                <div className="p-3 mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="rounded-xl h-12 text-center text-lg tracking-[0.3em] font-mono border-border focus-visible:ring-primary focus-visible:border-primary"
                    required
                    maxLength={6}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                  disabled={loading || !verificationCode || verificationCode.length < 6}
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {verificationMethod !== 'totp' && (
                <p className="text-center text-sm text-muted-foreground mt-4">
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

              <p className="text-center text-sm text-muted-foreground mt-3">
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
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 font-sans">Welcome back</h1>
                <p className="text-muted-foreground">Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="p-3 mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Social login */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl mb-4 font-medium transition-all duration-200 border-border hover:bg-accent cursor-pointer"
                onClick={handleGoogleSignIn}
                disabled={loading || fetchStatus === 'fetching' || !signIn}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground uppercase font-semibold">Or email</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl h-11 border-border focus-visible:ring-primary focus-visible:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={show ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 rounded-xl h-11 border-border focus-visible:ring-primary focus-visible:border-primary"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                  disabled={loading || fetchStatus === 'fetching' || !signIn}
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
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


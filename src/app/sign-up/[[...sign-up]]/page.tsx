'use client';

import { useState, useEffect } from 'react';
import { useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Lock, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const perks = [
  'Access aggregated job opportunities',
  'AI-powered job matching',
  'One-click applications',
  'Free forever for job seekers',
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
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Sign up state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Verification state
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [verifyingError, setVerifyingError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (isUserLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isUserLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signUpErr } = await signUp.password({
        emailAddress: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      });

      if (signUpErr) {
        setError(signUpErr.message || 'Failed to create account. Please check your inputs.');
        setLoading(false);
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            const url = decorateUrl('/dashboard');
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
          setError(sendErr.message || 'Failed to send verification code.');
          setLoading(false);
          return;
        }
        setVerifying(true);
      } else {
        setError(`Sign up failed: status is ${signUp.status}`);
      }
    } catch (err: any) {
      console.error('Email sign-up error:', err);
      setError(err.message || 'Failed to create account.');
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
        setVerifyingError(verifyErr.message || 'Verification failed. Please check the code.');
        setVerifyingLoading(false);
        return;
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            const url = decorateUrl('/dashboard');
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        setVerifyingError(`Verification incomplete. Status: ${signUp.status}`);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerifyingError(err.message || 'Verification failed.');
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
        setVerifyingError(resendErr.message || 'Failed to resend verification code.');
        return;
      }
      setResendMessage('A new verification code has been sent.');
    } catch (err: any) {
      console.error('Resend code error:', err);
      setVerifyingError(err.message || 'Failed to resend verification code.');
    }
  };

  const handleGoogleSignUp = async () => {
    if (!signUp) return;
    setLoading(true);
    setError('');

    try {
      const { error: ssoErr } = await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: '/dashboard',
        redirectCallbackUrl: '/sso-callback',
      });
      if (ssoErr) {
        setError(ssoErr.message || 'OAuth error occurred.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      setError(err.message || 'OAuth error occurred.');
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,white,transparent_60%)]" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <Image
            src="/logo-circle.png"
            alt="JobFusion Logo"
            width={36}
            height={36}
            className="rounded-full object-cover border border-white/20"
          />
          <span className="font-bold text-xl text-white font-sans">JobFusion</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-extrabold text-white font-sans">
            Start your journey to your dream job.
          </h2>
          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" />
                <span className="text-white/80">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/50 text-sm relative z-10">© 2026 JobFusion Inc.</p>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image
              src="/logo-circle.png"
              alt="JobFusion Logo"
              width={32}
              height={32}
              className="rounded-full object-cover border border-border/40"
            />
            <span className="font-bold text-xl gradient-brand-text font-sans">JobFusion</span>
          </div>

          {!verifying ? (
            // Phase 1: Sign Up Form
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 font-sans">Create your account</h1>
                <p className="text-muted-foreground text-sm">Free forever. No credit card required.</p>
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
                className="w-full h-11 rounded-xl mb-4 font-medium transition-all duration-200 border-border hover:bg-accent"
                onClick={handleGoogleSignUp}
                disabled={loading || fetchStatus === 'fetching' || !signUp}
              >
                <GoogleIcon />
                Sign up with Google
              </Button>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground uppercase font-semibold">Or email</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fname">First name</Label>
                    <Input
                      id="fname"
                      placeholder="Rahul"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-xl h-11 border-border focus-visible:ring-primary focus-visible:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lname">Last name</Label>
                    <Input
                      id="lname"
                      placeholder="Sharma"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-xl h-11 border-border focus-visible:ring-primary focus-visible:border-primary"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

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
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={show ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
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

                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="terms"
                    className="mt-0.5 border-border focus-visible:ring-primary data-[state=checked]:bg-primary"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                    required
                    disabled={loading}
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none">
                    I agree to the <Link href="/" className="text-primary font-semibold hover:underline">Terms of Service</Link> and <Link href="/" className="text-primary font-semibold hover:underline">Privacy Policy</Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                  disabled={loading || fetchStatus === 'fetching' || !signUp}
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-primary font-semibold hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            // Phase 2: OTP Verification
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 font-sans">Verify your email</h1>
                <p className="text-muted-foreground text-sm">
                  We sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>. Please enter it below.
                </p>
              </div>

              {verifyingError && (
                <div className="p-3 mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{verifyingError}</span>
                </div>
              )}

              {resendMessage && (
                <div className="p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{resendMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-center text-xl tracking-widest rounded-xl h-12 border-border focus-visible:ring-primary focus-visible:border-primary font-mono font-semibold"
                    required
                    disabled={verifyingLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                  disabled={verifyingLoading || code.length < 6}
                >
                  {verifyingLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex flex-col gap-3 mt-8">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm font-semibold text-primary hover:underline focus:outline-none"
                  disabled={verifyingLoading}
                >
                  I need a new code
                </button>
                
                <button
                  type="button"
                  onClick={handleBackToSignUp}
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none mt-2"
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

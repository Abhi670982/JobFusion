'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Code2, ArrowRight, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const perks = [
  'Access 2.4M+ job opportunities',
  'AI-powered job matching',
  'One-click applications',
  'Free forever for job seekers',
];

export default function SignUpPage() {
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<'jobseeker' | 'recruiter'>('jobseeker');

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between p-10 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,white,transparent_60%)]" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>JobFusion</span>
        </Link>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-extrabold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
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

        <p className="text-white/50 text-sm relative z-10">© 2025 JobFusion Inc.</p>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl gradient-brand-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>JobFusion</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Create your account</h1>
            <p className="text-muted-foreground">Free forever. No credit card required.</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-muted rounded-xl mb-6">
            {(['jobseeker', 'recruiter'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${role === r ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {r === 'jobseeker' ? '🎯 Job Seeker' : '🏢 Recruiter'}
              </button>
            ))}
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button variant="outline" className="rounded-xl h-11 gap-2 font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.45 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Google
            </Button>
            <Button variant="outline" className="rounded-xl h-11 gap-2 font-medium">
              <Code2 className="w-4 h-4" />
              GitHub
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">Or sign up with email</span>
            </span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); window.location.href = '/dashboard'; }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fname">First name</Label>
                <Input id="fname" placeholder="Rahul" className="rounded-xl h-11" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lname">Last name</Label>
                <Input id="lname" placeholder="Sharma" className="rounded-xl h-11" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10 rounded-xl h-11" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={show ? 'text' : 'password'} placeholder="Min. 8 characters" className="pl-10 pr-10 rounded-xl h-11" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Checkbox id="terms" className="mt-0.5" required />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the <Link href="/" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-lg">
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

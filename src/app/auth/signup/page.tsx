'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Code2, ArrowRight, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
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
          <Image
            src="/logo-circle.png"
            alt="JobFusion Logo"
            width={36}
            height={36}
            className="rounded-full object-cover border border-white/20"
          />
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
            <Image
              src="/logo-circle.png"
              alt="JobFusion Logo"
              width={32}
              height={32}
              className="rounded-full object-cover border border-border/40"
            />
            <span className="font-bold text-xl gradient-brand-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>JobFusion</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Create your account</h1>
            <p className="text-muted-foreground text-sm">Free forever. No credit card required.</p>
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

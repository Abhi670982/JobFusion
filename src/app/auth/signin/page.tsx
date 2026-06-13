'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Code2, ArrowRight, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SignInPage() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
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
            className="rounded-full object-cover border border-white/20"
          />
          <span className="font-bold text-xl text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>JobFusion</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Your next great opportunity awaits.
            </h2>
            <p className="text-white/75 text-lg">Join 125,000+ professionals who found their dream jobs.</p>
          </div>
          <div className="space-y-4">
            {[
              { stat: '2.4M+', label: 'Jobs aggregated daily' },
              { stat: '94%', label: 'Average AI match accuracy' },
              { stat: '18 days', label: 'Average time to hire' },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex items-center gap-4">
                <div className="text-2xl font-bold text-white">{stat}</div>
                <div className="text-white/70 text-sm">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex -space-x-2">
            {['SC', 'MJ', 'PP', 'AR', 'DK'].map((init, i) => (
              <div key={i} className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xs font-semibold">
                {init}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full bg-white/30 border-2 border-white/40 flex items-center justify-center text-white text-xs font-semibold">
              +5k
            </div>
          </div>
        </div>

        <p className="text-white/50 text-sm relative z-10">© 2025 JobFusion Inc.</p>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
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
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>



          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); window.location.href = '/dashboard'; }} className="space-y-4">
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
                  className="pl-10 rounded-xl h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
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
                  className="pl-10 pr-10 rounded-xl h-11"
                  required
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold hover:opacity-90 shadow-lg">
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

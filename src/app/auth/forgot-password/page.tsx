'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background mesh-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center gap-2 mb-10 justify-center">
          <Image
            src="/logo-circle.png"
            alt="JobFusion Logo"
            width={36}
            height={36}
            className="rounded-full object-cover border border-border/40"
          />
          <span className="font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="gradient-brand-text">Job</span>Fusion
          </span>
        </Link>

        <div className="card-premium p-8">
          {!sent ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Reset your password
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
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
                <Button type="submit" className="w-full h-11 rounded-xl gradient-brand text-white border-0 font-semibold">
                  Send Reset Link
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Check your email</h1>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>. Check your inbox and spam folder.
              </p>
              <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => setSent(false)}>
                Try another email
              </Button>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <Link href="/auth/signin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

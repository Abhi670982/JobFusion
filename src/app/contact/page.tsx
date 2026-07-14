'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, BookOpen, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // UI/Submission states
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', title: string, msg: string) => {
    setToast({ type, title, message: msg });
    setTimeout(() => setToast(null), 5000);
  };

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      tempErrors.name = 'Full Name is required';
    } else if (name.trim().length > 100) {
      tempErrors.name = 'Name must be under 100 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      tempErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email address';
    } else if (email.trim().length > 254) {
      tempErrors.email = 'Email must be under 254 characters';
    }

    if (!subject.trim()) {
      tempErrors.subject = 'Subject is required';
    } else if (subject.trim().length > 200) {
      tempErrors.subject = 'Subject must be under 200 characters';
    }

    if (!message.trim()) {
      tempErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      tempErrors.message = 'Message must be at least 10 characters';
    } else if (message.trim().length > 5000) {
      tempErrors.message = 'Message must be under 5000 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast('success', 'Message Sent', data.message || 'Your message has been sent successfully.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setErrors({});
      } else {
        showToast('error', 'Submission Failed', data.error || 'Failed to submit the form.');
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      showToast('error', 'Connection Error', 'An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
      </div>

      <div className="flex flex-col gap-1.5 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Contact Us
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Have questions or need assistance? Fill out the form below and our team will get back to you shortly.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card-premium p-6 sm:p-8 space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="John Doe"
                className={`rounded-xl pl-10 h-11 transition-all ${
                  errors.name ? 'border-destructive/60 focus-visible:ring-destructive/20' : ''
                }`}
                disabled={submitting}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="john@example.com"
                className={`rounded-xl pl-10 h-11 transition-all ${
                  errors.email ? 'border-destructive/60 focus-visible:ring-destructive/20' : ''
                }`}
                disabled={submitting}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-semibold text-muted-foreground uppercase">
              Subject
            </Label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
              <Input
                id="subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
                }}
                placeholder="How can we help you?"
                className={`rounded-xl pl-10 h-11 transition-all ${
                  errors.subject ? 'border-destructive/60 focus-visible:ring-destructive/20' : ''
                }`}
                disabled={submitting}
              />
            </div>
            {errors.subject && (
              <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.subject}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-xs font-semibold text-muted-foreground uppercase">
              Message
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/80" />
              <Textarea
                id="message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
                }}
                placeholder="Type your message here..."
                rows={5}
                className={`rounded-xl pl-10 pt-3 resize-none transition-all ${
                  errors.message ? 'border-destructive/60 focus-visible:ring-destructive/20' : ''
                }`}
                disabled={submitting}
              />
            </div>
            {errors.message && (
              <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl gradient-brand text-white border-0 py-2.5 h-11 shadow-lg shadow-primary/10 glow-sm btn-press touch-auto flex items-center justify-center gap-2 text-sm font-semibold transition-all mt-6"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl glass border shadow-2xl flex items-start gap-3 bg-card/90 ${
              toast.type === 'success' ? 'border-emerald-500/20' : 'border-rose-500/20'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4.5 h-4.5" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                toast.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {toast.title}
              </h4>
              <p className="text-sm font-semibold text-foreground mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground touch-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

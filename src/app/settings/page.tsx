'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';


export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="flex-1 p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your preferences and appearance</p>
        </div>

        <div className="card-premium p-6 animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  const currentTheme = theme === 'system' ? 'dark' : theme; // default to dark if system or fallback

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
        <p className="text-muted-foreground text-sm font-medium">Manage your preferences and appearance</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="card-premium p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Appearance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Customize the visual theme of the JobFusion interface.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
          {/* Light Theme Card */}
          <button
            onClick={() => setTheme('light')}
            className={cn(
              "flex flex-col items-center gap-3.5 p-6 rounded-2xl border-2 text-center transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40",
              currentTheme === 'light'
                ? "border-primary bg-primary/5 text-primary shadow-[0_0_25px_rgba(99,102,241,0.15)] font-semibold"
                : "border-border/60 bg-card/45 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              currentTheme === 'light' 
                ? "bg-primary text-white scale-110 shadow-lg" 
                : "bg-muted text-muted-foreground"
            )}>
              <Sun className="w-6 h-6" />
            </div>
            <div className="text-sm">☀️ Light Mode</div>
            {currentTheme === 'light' && (
              <motion.div
                layoutId="activeThemeGlow"
                className="absolute inset-x-0 bottom-0 h-1 bg-primary"
              />
            )}
          </button>

          {/* Dark Theme Card */}
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "flex flex-col items-center gap-3.5 p-6 rounded-2xl border-2 text-center transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40",
              currentTheme === 'dark'
                ? "border-primary bg-primary/5 text-primary shadow-[0_0_25px_rgba(99,102,241,0.15)] font-semibold"
                : "border-border/60 bg-card/45 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              currentTheme === 'dark' 
                ? "bg-primary text-white scale-110 shadow-lg" 
                : "bg-muted text-muted-foreground"
            )}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="text-sm">🌙 Dark Mode</div>
            {currentTheme === 'dark' && (
              <motion.div
                layoutId="activeThemeGlow"
                className="absolute inset-x-0 bottom-0 h-1 bg-primary"
              />
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
}

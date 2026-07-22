'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BYOKModalProps {
  open: boolean;
  onClose: () => void;
}

export function BYOKModal({ open, onClose }: BYOKModalProps) {
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'claude'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setApiKey('');
      setShowKey(false);
    }
  }, [open, provider]);

  const validateKeyFormat = () => {
    if (!apiKey.trim()) return false;
    if (provider === 'openai' && !apiKey.startsWith('sk-')) return false;
    if (provider === 'claude' && !apiKey.startsWith('sk-ant-')) return false;
    if (provider === 'gemini' && apiKey.length < 30) return false;
    return true;
  };

  const handleSave = async () => {
    if (!validateKeyFormat()) {
      toast.error('Invalid API key format for the selected provider.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        openaiKey: provider === 'openai' ? apiKey : undefined,
        geminiKey: provider === 'gemini' ? apiKey : undefined,
        claudeKey: provider === 'claude' ? apiKey : undefined,
      };

      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('API key encrypted and saved securely!');
        onClose();
      } else {
        toast.error(data.error || 'Failed to save API key');
      }
    } catch {
      toast.error('An error occurred while saving the API key.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Use Your Own AI API Key</h2>
                    <p className="text-xs text-muted-foreground">BYOK Architecture</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">1. Choose AI Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['gemini', 'openai', 'claude'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setProvider(p)}
                        className={cn(
                          "py-2.5 px-3 rounded-lg text-sm font-medium transition-all border",
                          provider === p
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-transparent hover:bg-muted text-muted-foreground"
                        )}
                      >
                        {p === 'gemini' && 'Gemini'}
                        {p === 'openai' && 'OpenAI'}
                        {p === 'claude' && 'Claude'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">2. Enter API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        provider === 'openai' ? 'sk-...' :
                        provider === 'claude' ? 'sk-ant-...' :
                        'AIzaSy...'
                      }
                      className="w-full bg-background border border-border rounded-xl pl-4 pr-11 py-3 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Your key is encrypted on the server before storage. We never log or expose your API keys.
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!apiKey.trim() || isSaving}
                    className="flex-1 rounded-xl gap-2"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save & Continue'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

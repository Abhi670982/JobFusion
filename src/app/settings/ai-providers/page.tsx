'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Key, CheckCircle2, AlertCircle, Trash2, Edit3, Plus, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AIProvidersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Connection States
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);
  const [hasClaude, setHasClaude] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini' | 'claude'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchKeys() {
      try {
        const res = await fetch('/api/user/api-keys');
        const json = await res.json();
        if (json.success && json.data) {
          setHasOpenAI(json.data.hasOpenAIKey);
          setHasGemini(json.data.hasGeminiKey);
          setHasClaude(json.data.hasClaudeKey);
        }
      } catch (err) {
        console.error("Failed to fetch API keys status:", err);
      } finally {
        setLoading(false);
      }
    }

    setMounted(true);
    fetchKeys();
  }, []);

  const refreshKeys = async () => {
    try {
      const res = await fetch('/api/user/api-keys');
      const json = await res.json();
      if (json.success && json.data) {
        setHasOpenAI(json.data.hasOpenAIKey);
        setHasGemini(json.data.hasGeminiKey);
        setHasClaude(json.data.hasClaudeKey);
      }
    } catch (err) {
      console.error("Failed to fetch API keys status:", err);
    }
  };

  const validateKeyFormat = () => {
    if (!apiKey.trim()) return false;
    if (selectedProvider === 'openai' && !apiKey.startsWith('sk-')) return false;
    if (selectedProvider === 'claude' && !apiKey.startsWith('sk-ant-')) return false;
    if (selectedProvider === 'gemini' && apiKey.length < 30) return false;
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
        openaiKey: selectedProvider === 'openai' ? apiKey : undefined,
        geminiKey: selectedProvider === 'gemini' ? apiKey : undefined,
        claudeKey: selectedProvider === 'claude' ? apiKey : undefined,
      };

      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} key connected securely!`);
        setModalOpen(false);
        setApiKey('');
        refreshKeys();
      } else {
        toast.error(data.error || 'Failed to save API key');
      }
    } catch {
      toast.error('An error occurred while saving the API key.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (provider: 'openai' | 'gemini' | 'claude') => {
    setIsDeleting(true);
    try {
      // Deleting a specific key by sending empty string to override it
      
      // Wait, our backend POST route uses if(key && key.trim())
      // We actually need a way to delete specific keys.
      // Let's modify the backend DELETE route later to handle specific keys.
      // For now, if we pass empty, the current POST route ignores it. 
      // We should use a specific endpoint or update POST.
      
      // We will create a DELETE request to /api/user/api-keys?provider=...
      const res = await fetch(`/api/user/api-keys?provider=${provider}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('API Key disconnected successfully');
        refreshKeys();
      } else {
        toast.error('Failed to disconnect API key');
      }
    } catch {
      toast.error('An error occurred while disconnecting the API key.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openProviderModal = (provider: 'openai' | 'gemini' | 'claude') => {
    setSelectedProvider(provider);
    setApiKey('');
    setShowKey(false);
    setModalOpen(true);
  };

  if (!mounted) {
    return (
      <main className="flex-1 p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="mb-2">
          <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground -ml-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
          </Button>
        </div>
        <div className="card-premium p-6 animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="h-24 bg-muted rounded-xl mt-4" />
        </div>
      </main>
    );
  }

  const providers = [
    {
      id: 'gemini' as const,
      name: 'Google Gemini',
      description: 'Superfast AI for resume and job matching',
      connected: hasGemini,
      placeholder: 'AIzaSy...'
    },
    {
      id: 'openai' as const,
      name: 'OpenAI (ChatGPT)',
      description: 'Industry standard for complex reasoning',
      connected: hasOpenAI,
      placeholder: 'sk-...'
    },
    {
      id: 'claude' as const,
      name: 'Anthropic Claude',
      description: 'Excellent for deep document analysis',
      connected: hasClaude,
      placeholder: 'sk-ant-...'
    }
  ];

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings')}
          className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-2 transition-all touch-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>AI Providers (BYOK)</h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium mt-2">
          Configure your own API keys to bypass daily AI limits. Your keys are encrypted via AES-256-GCM.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-4"
        >
          {providers.map((p) => (
            <div key={p.id} className="card-premium p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/50 border flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    {p.name}
                    {p.connected ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        Not Connected
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {p.connected ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openProviderModal(p.id)}
                      className="rounded-lg h-9 text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Replace
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(p.id)}
                      disabled={isDeleting}
                      className="rounded-lg h-9 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Disconnect
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => openProviderModal(p.id)}
                    className="rounded-lg h-9 text-xs gradient-brand text-white border-0 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Connect Key
                  </Button>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Connect Key Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Connect {providers.find(p => p.id === selectedProvider)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={providers.find(p => p.id === selectedProvider)?.placeholder}
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
                Your key is encrypted before storage. We never log or expose your API keys.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!apiKey.trim() || isSaving}
              className="rounded-xl gradient-brand text-white border-0 shadow-sm gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Connecting...' : 'Connect Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

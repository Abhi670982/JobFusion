"use client";

import { useState } from "react";
import { Zap, Key, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface AiLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
  onUseOwnKey?: () => void;
}

export function AiLimitModal({
  open,
  onOpenChange,
  onUpgrade,
  onUseOwnKey,
}: AiLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl">Daily AI Limit Reached</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            You've used today's free AI quota. Choose one of the following options to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upgrade Option */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all cursor-pointer group"
            onClick={onUpgrade}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Upgrade to Pro</h3>
                <p className="text-sm text-muted-foreground">
                  Get unlimited AI requests with Pro Monthly or Pro Yearly. No daily limits.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Use Own Key Option */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all cursor-pointer group"
            onClick={onUseOwnKey}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Key className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Use Your Own API Key</h3>
                <p className="text-sm text-muted-foreground">
                  Bring your own OpenAI, Gemini, or Claude API key. Your keys are encrypted and never shared.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to handle AI limit errors from API responses
export function useAiLimitHandler() {
  const [showModal, setShowModal] = useState(false);

  const handleApiError = (error: any) => {
    if (error?.code === "AI_LIMIT_REACHED" || error?.message === "Daily AI limit reached.") {
      setShowModal(true);
      return true;
    }
    return false;
  };

  const handleUpgrade = () => {
    setShowModal(false);
    window.location.href = "/pricing";
  };

  const handleUseOwnKey = () => {
    setShowModal(false);
    window.location.href = "/settings?tab=api-keys";
  };

  return {
    showModal,
    setShowModal,
    handleApiError,
    handleUpgrade,
    handleUseOwnKey,
    AiLimitModalComponent: () => (
      <AiLimitModal
        open={showModal}
        onOpenChange={setShowModal}
        onUpgrade={handleUpgrade}
        onUseOwnKey={handleUseOwnKey}
      />
    ),
  };
}

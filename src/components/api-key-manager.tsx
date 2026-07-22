"use client";

import { useState, useEffect } from "react";
import { Key, Eye, EyeOff, Save, Trash2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ApiKeyManagerProps {
  userId?: string;
}

type KeyType = "openai" | "gemini" | "claude";

interface ApiKeys {
  openaiKey?: string;
  geminiKey?: string;
  claudeKey?: string;
}

export function ApiKeyManager({ userId }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<KeyType, boolean>>({
    openai: false,
    gemini: false,
    claude: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);

  const toggleVisibility = (keyType: KeyType) => {
    setVisibleKeys((prev) => ({ ...prev, [keyType]: !prev[keyType] }));
  };

  const handleKeyChange = (keyType: KeyType, value: string) => {
    setKeys((prev) => ({ ...prev, [`${keyType}Key`]: value }));
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...keys }),
      });

      const data = await response.json();

      if (data.success) {
        setHasKeys(true);
        toast.success("API keys saved successfully. They are encrypted and secure.");
      } else {
        toast.error(data.error || "Failed to save API keys");
      }
    } catch {
      toast.error("Failed to save API keys. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    if (!confirm("Are you sure you want to delete all your API keys? This action cannot be undone.")) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setKeys({});
        setHasKeys(false);
        toast.success("API keys deleted successfully.");
      } else {
        toast.error(data.error || "Failed to delete API keys");
      }
    } catch {
      toast.error("Failed to delete API keys. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const loadKeys = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/user/api-keys?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setKeys({
          openaiKey: data.data.openaiKey || "",
          geminiKey: data.data.geminiKey || "",
          claudeKey: data.data.claudeKey || "",
        });
        setHasKeys(!!(data.data.openaiKey || data.data.geminiKey || data.data.claudeKey));
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }
  };

  // Load keys on mount
  useEffect(() => {
    if (userId) loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const keyConfigs: Array<{
    type: KeyType;
    label: string;
    placeholder: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      type: "openai",
      label: "OpenAI API Key",
      placeholder: "sk-...",
      description: "Used for GPT-4, GPT-3.5, and other OpenAI models",
      icon: <Key className="h-4 w-4" />,
    },
    {
      type: "gemini",
      label: "Gemini API Key",
      placeholder: "AIza...",
      description: "Used for Google Gemini AI models",
      icon: <Key className="h-4 w-4" />,
    },
    {
      type: "claude",
      label: "Claude API Key",
      placeholder: "sk-ant-...",
      description: "Used for Anthropic Claude models",
      icon: <Key className="h-4 w-4" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Bring Your Own API Keys
        </CardTitle>
        <CardDescription>
          Add your own API keys to bypass daily limits. Keys are encrypted before storage and never logged or exposed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasKeys && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">
              Your API keys are configured and active
            </span>
          </motion.div>
        )}

        {keyConfigs.map((config) => (
          <div key={config.type} className="space-y-2">
            <Label htmlFor={`${config.type}-key`} className="flex items-center gap-2">
              {config.icon}
              {config.label}
            </Label>
            <div className="relative">
              <Input
                id={`${config.type}-key`}
                type={visibleKeys[config.type] ? "text" : "password"}
                placeholder={config.placeholder}
                value={keys[`${config.type}Key`] || ""}
                onChange={(e) => handleKeyChange(config.type, e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10"
                onClick={() => toggleVisibility(config.type)}
              >
                {visibleKeys[config.type] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        ))}

        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Your API keys are encrypted using AES-256 encryption before storage. We never log or expose your keys to third parties.
            You can delete them at any time.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Keys
              </>
            )}
          </Button>
          {hasKeys && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

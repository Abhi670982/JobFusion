"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  Zap,
  Globe,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Save,
  Mail,
} from "lucide-react";

interface FeatureFlags {
  aiRecommendations: boolean;
  scraperEnabled: boolean;
  resumeParsing: boolean;
}

interface SettingsPayload {
  maintenanceMode: boolean;
  homepageAnnouncement: string;
  geminiKeyPlaceholder: string;
  contactEmail: string;
  featureFlags: FeatureFlags;
  futureIntegrations: Record<string, any>;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
      } else {
        setError(json.error || "Failed to load global configurations.");
      }
    } catch (err: any) {
      setError(err.message || "Connection timeout with settings API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Settings updated successfully!");
        setSettings(json.data);
      } else {
        alert(json.error || "Failed to update configuration settings.");
      }
    } catch (err: any) {
      alert(err.message || "Timeout writing configurations to database.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFlag = (key: keyof FeatureFlags) => {
    if (!settings) return;
    setSettings({
      ...settings,
      featureFlags: {
        ...settings.featureFlags,
        [key]: !settings.featureFlags[key],
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-[#a1a1aa] font-semibold">Retrieving platform configurations...</p>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/30 p-8 max-w-md mx-auto text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-[#71717a] mx-auto" />
        <h3 className="text-sm font-bold text-[#f4f4f5]">Configuration Offline</h3>
        <p className="text-xs text-[#a1a1aa]">{error || "No database records retrieved."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#f4f4f5]" style={{ fontFamily: "var(--font-jakarta)" }}>
            Platform Settings & Feature Flags
          </h2>
          <p className="text-xs text-[#a1a1aa] mt-1">Configure global announcements, toggle feature flags, or audit API keys.</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-all disabled:opacity-50 touch-auto"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving Changes..." : "Save Settings"}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-xs font-semibold text-emerald-400">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: General & Key Config */}
        <div className="space-y-6">
          {/* General */}
          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" /> General Settings
            </h3>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between py-2 border-b border-[#27272a]/60">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#e4e4e7]">Maintenance Mode</p>
                <p className="text-[10px] text-[#71717a]">Disable public access and display holding screen.</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className="p-1 text-[#71717a] hover:text-[#f4f4f5] transition-all touch-auto"
              >
                {settings.maintenanceMode ? (
                  <ToggleRight className="w-8 h-8 text-red-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#52525b]" />
                )}
              </button>
            </div>

            {/* Homepage Announcement */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-[#e4e4e7] block">Homepage Announcement Banner</label>
              <textarea
                value={settings.homepageAnnouncement}
                onChange={(e) => setSettings({ ...settings, homepageAnnouncement: e.target.value })}
                placeholder="Alert banners displayed at the top of the landing page. Leave empty to hide..."
                className="w-full h-20 bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] p-3 rounded-xl outline-none transition-all placeholder-[#71717a] resize-none"
              />
            </div>
          </div>

          {/* AI configurations */}
          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" /> AI Configurations
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#e4e4e7] block">Gemini API Key Override</label>
              <input
                type="text"
                value={settings.geminiKeyPlaceholder}
                onChange={(e) => setSettings({ ...settings, geminiKeyPlaceholder: e.target.value })}
                placeholder="AI parsing credentials (sk_gemini_...). E.g. sk_test..."
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
              <p className="text-[9px] text-[#71717a]">
                Custom credentials stored securely. Leave blank to inherit system-default environment key.
              </p>
            </div>
          </div>

          {/* Contact Support Email */}
          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" /> Contact Email Settings
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#e4e4e7] block">Contact Support Email</label>
              <input
                type="email"
                value={settings.contactEmail || ""}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="support@gohyred.ai"
                className="w-full bg-[#09090b]/60 border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#f4f4f5] px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder-[#71717a]"
              />
              <p className="text-[9px] text-[#71717a]">
                All public contact form submissions will be forwarded to this support email address.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Feature Flags & Integrations */}
        <div className="space-y-6">
          {/* Feature Flags */}
          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" /> Platform Feature Flags
            </h3>

            {/* AI match recommendations flag */}
            <div className="flex items-center justify-between py-2 border-b border-[#27272a]/60">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#e4e4e7]">AI Job Recommendations</p>
                <p className="text-[10px] text-[#71717a]">Perform skill matching logic on job listings.</p>
              </div>
              <button
                onClick={() => handleToggleFlag("aiRecommendations")}
                className="p-1 text-[#71717a] hover:text-[#f4f4f5] transition-all touch-auto"
              >
                {settings.featureFlags.aiRecommendations ? (
                  <ToggleRight className="w-8 h-8 text-indigo-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#52525b]" />
                )}
              </button>
            </div>

            {/* Scraper enable flag */}
            <div className="flex items-center justify-between py-2 border-b border-[#27272a]/60">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#e4e4e7]">Active Job Scrapers</p>
                <p className="text-[10px] text-[#71717a]">Run scheduled web crawlers to sync new openings.</p>
              </div>
              <button
                onClick={() => handleToggleFlag("scraperEnabled")}
                className="p-1 text-[#71717a] hover:text-[#f4f4f5] transition-all touch-auto"
              >
                {settings.featureFlags.scraperEnabled ? (
                  <ToggleRight className="w-8 h-8 text-indigo-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#52525b]" />
                )}
              </button>
            </div>

            {/* Resume parsing flag */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#e4e4e7]">Resume Upload & Parse</p>
                <p className="text-[10px] text-[#71717a]">Allow jobseekers to upload resumes and trigger parsing.</p>
              </div>
              <button
                onClick={() => handleToggleFlag("resumeParsing")}
                className="p-1 text-[#71717a] hover:text-[#f4f4f5] transition-all touch-auto"
              >
                {settings.featureFlags.resumeParsing ? (
                  <ToggleRight className="w-8 h-8 text-indigo-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#52525b]" />
                )}
              </button>
            </div>
          </div>

          {/* Future integrations */}
          <div className="rounded-2xl border border-[#27272a] bg-[#18181b]/20 p-6 space-y-4 opacity-75">
            <h3 className="text-xs font-bold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-indigo-400" /> Future Integrations
            </h3>
            <p className="text-xs text-[#71717a] leading-relaxed">
              Integrations like Slack webhooks, email broadcasts, and automatic database backup configurations are currently reserved for future phases.
            </p>
            <div className="p-3 border border-dashed border-[#27272a] rounded-xl text-center text-[10px] text-[#71717a] font-semibold">
              Module Locked (Phase 2/3)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

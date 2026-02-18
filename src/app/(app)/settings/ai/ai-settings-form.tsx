"use client";

import { useState } from "react";
import {
  Settings,
  Key,
  Sparkles,
  Shield,
  Check,
  X,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { saveAiSettings, removeApiKey } from "@/actions/ai-settings";
import Link from "next/link";

interface AiSettings {
  provider: string;
  hasApiKey: boolean;
  autoCategorize: boolean;
  categorizeThreshold: number;
}

interface AiSettingsFormProps {
  settings: AiSettings | null;
}

export function AiSettingsForm({ settings }: AiSettingsFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [autoCategorize, setAutoCategorize] = useState(
    settings?.autoCategorize ?? false
  );
  const [threshold, setThreshold] = useState(
    settings?.categorizeThreshold ?? 0.7
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isRemovingKey, setIsRemovingKey] = useState(false);

  const hasApiKey = settings?.hasApiKey ?? false;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      if (apiKey) formData.append("apiKey", apiKey);
      formData.append("autoCategorize", String(autoCategorize));
      formData.append("categorizeThreshold", String(threshold));

      const result = await saveAiSettings(formData);
      if (result.errors) {
        setError(result.errors.general);
      } else {
        setSuccess(true);
        setApiKey("");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save settings"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    if (
      !confirm("Are you sure? This will disable AI-powered categorization.")
    ) {
      return;
    }
    setIsRemovingKey(true);
    setError(null);

    try {
      const result = await removeApiKey();
      if (result.errors) {
        setError(result.errors.general);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove API key"
      );
    } finally {
      setIsRemovingKey(false);
    }
  };

  const thresholdLabels: Record<string, string> = {
    "0.3": "Accept more suggestions, less accurate",
    "0.5": "More lenient",
    "0.7": "Balanced (recommended)",
    "0.8": "More strict",
    "0.9": "Only very confident suggestions",
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-base text-charcoal-500 hover:text-charcoal-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Settings
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-charcoal-200">
        <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
          <Settings className="w-7 h-7 text-brand-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900">AI Settings</h1>
          <p className="text-lg text-charcoal-500 mt-1">
            Optional: Configure AI-powered invoice categorization
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-cream-50 rounded-2xl border border-cream-200 p-6 space-y-4">
        <h2 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-600" />
          How Invoice Categorization Works
        </h2>
        <p className="text-base text-charcoal-600">
          Your invoices go through multiple layers of categorization:
        </p>

        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 border border-cream-200 flex items-start gap-3">
            <span className="px-2 py-1 bg-success-100 text-success-600 text-sm font-bold rounded-lg whitespace-nowrap">
              Always On
            </span>
            <div>
              <p className="font-semibold text-charcoal-900">
                Layer 1: Keywords
              </p>
              <p className="text-charcoal-600">
                Fast, free, automatic. Matches line item descriptions to
                categories.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-cream-200 flex items-start gap-3">
            <span className="px-2 py-1 bg-success-100 text-success-600 text-sm font-bold rounded-lg whitespace-nowrap">
              Always On
            </span>
            <div>
              <p className="font-semibold text-charcoal-900">
                Layer 2: Vendor Memory
              </p>
              <p className="text-charcoal-600">
                Free, automatic. Learns from your past categorizations.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-cream-200 flex items-start gap-3">
            <span
              className={`px-2 py-1 text-sm font-bold rounded-lg whitespace-nowrap ${
                hasApiKey
                  ? "bg-success-100 text-success-600"
                  : "bg-warning-100 text-warning-600"
              }`}
            >
              {hasApiKey ? "Enabled" : "Optional"}
            </span>
            <div>
              <p className="font-semibold text-charcoal-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Layer 3: Gemini AI
              </p>
              <p className="text-charcoal-600">
                Optional, requires your free Google API key. Most powerful
                categorization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* API Key */}
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal-900">
              Gemini API Key
            </h2>
          </div>

          {hasApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-success-100 border border-success-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-6 h-6 text-success-600" />
                  <span className="text-lg font-semibold text-success-600">
                    API Key Configured
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveKey}
                disabled={isRemovingKey}
                className="w-full h-12 rounded-xl text-base font-semibold bg-danger-100 text-danger-600 hover:bg-danger-200 border border-danger-200 transition-colors flex items-center justify-center gap-2"
              >
                {isRemovingKey ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Removing Key...
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5" />
                    Remove API Key
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-base text-charcoal-600">
                To enable AI-powered categorization, get a free Gemini API key:
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold text-lg"
              >
                Get a free Gemini API key
                <ExternalLink className="w-5 h-5" />
              </a>
              <div>
                <label className="block text-lg font-semibold text-charcoal-900 mb-2">
                  Enter your API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full h-12 px-4 rounded-xl border border-charcoal-200 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p className="text-sm text-charcoal-500 mt-2">
                  Your API key is encrypted and stored securely.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Auto-Categorize */}
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-charcoal-900">
                  Auto-Categorize
                </h2>
                <p className="text-base text-charcoal-500">
                  Automatically categorize new invoices
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoCategorize}
                onChange={(e) => setAutoCategorize(e.target.checked)}
                className="w-6 h-6 rounded accent-brand-600"
              />
            </label>
          </div>
          <p className="text-base text-charcoal-600 mt-3 ml-13">
            {autoCategorize
              ? "New invoices will be automatically categorized using all available layers."
              : "You can manually categorize invoices or use AI on demand."}
          </p>
        </div>

        {/* Confidence Threshold */}
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-charcoal-900">
                Confidence Threshold
              </h2>
              <p className="text-base text-charcoal-500">
                How confident should AI be before auto-applying a category?
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-charcoal-900">
                {threshold.toFixed(1)}
              </span>
              <span className="text-sm bg-brand-100 text-brand-700 px-3 py-1 rounded-full font-semibold">
                {thresholdLabels[threshold.toFixed(1)] ??
                  `Custom: ${threshold.toFixed(1)}`}
              </span>
            </div>

            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-3 bg-charcoal-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />

            <div className="flex justify-between text-sm text-charcoal-500">
              <span>Low (0.3)</span>
              <span>Medium (0.7)</span>
              <span>High (0.9)</span>
            </div>
          </div>

          <div className="bg-cream-50 border border-cream-200 rounded-xl p-4">
            <p className="text-base text-charcoal-600">
              <strong>Recommendation:</strong> Keep at 0.7 for a good balance.
              Lower values show more suggestions, higher values only suggest
              when very confident.
            </p>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="bg-danger-100 border border-danger-200 rounded-xl p-4">
            <p className="text-base font-semibold text-danger-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-success-100 border border-success-200 rounded-xl p-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-success-600" />
            <p className="text-base font-semibold text-success-600">
              Settings saved successfully!
            </p>
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl text-lg font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Save AI Settings
            </>
          )}
        </button>
      </form>

      {/* Footer note */}
      <div className="bg-charcoal-50 border border-charcoal-100 rounded-xl p-4">
        <p className="text-base text-charcoal-600">
          All settings are optional. Keyword and vendor memory categorization
          are always available for free. AI categorization requires a free
          Google Gemini API key.
        </p>
      </div>
    </div>
  );
}

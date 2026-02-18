"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signInWithMagicLink } from "@/actions/auth";
import Link from "next/link";
import { FileText, Loader2, Mail } from "lucide-react";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      if (mode === "magic") {
        const result = await signInWithMagicLink(formData);
        if (result.errors?.general?.includes("Check your email")) {
          setMagicLinkSent(true);
        } else if (result.errors) {
          setError(result.errors.general);
        }
      } else {
        const result = await signIn(formData);
        if (result?.success) {
          router.push(redirectTo ?? "/dashboard");
          return;
        }
        if (result?.errors) {
          setError(result.errors.general);
        }
      }
    } catch {
      // unexpected error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-charcoal-200/20 p-8 md:p-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 mb-4">
          <FileText className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal-900">Welcome back</h1>
        <p className="text-charcoal-500 mt-1">Sign in to Invoice Tracker</p>
      </div>

      {magicLinkSent ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-50 mb-4">
            <Mail className="w-7 h-7 text-success-600" />
          </div>
          <h2 className="text-lg font-semibold text-charcoal-900 mb-2">
            Check your email
          </h2>
          <p className="text-charcoal-500">
            We sent you a sign-in link. Click it to access your account.
          </p>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-charcoal-700 mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors text-base"
              placeholder="you@example.com"
            />
          </div>

          {mode === "password" && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-charcoal-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors text-base"
                placeholder="Your password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base min-h-[48px]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "magic" ? (
              "Send magic link"
            ) : (
              "Sign in"
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "password" ? "magic" : "password")}
              className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
            >
              {mode === "password"
                ? "Sign in with magic link instead"
                : "Sign in with password instead"}
            </button>
          </div>

          <div className="pt-2 text-center border-t border-charcoal-100">
            <p className="text-charcoal-500 text-sm pt-4">
              Don&apos;t have an account?{" "}
              <Link
                href={redirectTo ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}` : "/sign-up"}
                className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

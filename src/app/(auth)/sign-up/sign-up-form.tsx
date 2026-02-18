"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/actions/auth";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const result = await signUp(formData);
      if (result?.success) {
        router.push(redirectTo ?? "/dashboard");
        return;
      }
      if (result?.errors) {
        setError(result.errors.general);
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
        <h1 className="text-2xl font-bold text-charcoal-900">
          Create your account
        </h1>
        <p className="text-charcoal-500 mt-1">
          Get started with Invoice Tracker
        </p>
      </div>

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
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors text-base"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base min-h-[48px]"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Create account"
          )}
        </button>

        <div className="pt-2 text-center border-t border-charcoal-100">
          <p className="text-charcoal-500 text-sm pt-4">
            Already have an account?{" "}
            <Link
              href={redirectTo ? `/sign-in?redirect=${encodeURIComponent(redirectTo)}` : "/sign-in"}
              className="text-brand-600 hover:text-brand-700 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

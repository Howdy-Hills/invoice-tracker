"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-10 h-10 text-danger-500" />
      </div>
      <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-lg text-charcoal-600 mb-8">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      {error.digest && (
        <p className="text-sm text-charcoal-400 mb-4">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg"
      >
        <RotateCcw className="w-5 h-5" />
        Try Again
      </button>
    </div>
  );
}

import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-warning-50 flex items-center justify-center mx-auto mb-6">
        <FileQuestion className="w-10 h-10 text-warning-500" />
      </div>
      <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
        Page not found
      </h1>
      <p className="text-lg text-charcoal-600 mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </Link>
    </div>
  );
}

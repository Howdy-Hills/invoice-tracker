import { Suspense } from "react";
import { SignUpForm } from "./sign-up-form";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl shadow-lg shadow-charcoal-200/20 p-8 md:p-10 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}

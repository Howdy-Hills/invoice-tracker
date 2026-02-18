import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl shadow-lg shadow-charcoal-200/20 p-8 md:p-10 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}

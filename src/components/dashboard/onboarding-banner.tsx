import Link from "next/link";
import { Upload, Tags, Sparkles, ArrowRight } from "lucide-react";

interface OnboardingBannerProps {
  hasInvoices: boolean;
  hasCategories: boolean;
}

export function OnboardingBanner({
  hasInvoices,
  hasCategories,
}: OnboardingBannerProps) {
  // If both are done, don't show the banner
  if (hasInvoices && hasCategories) return null;

  const steps = [
    {
      done: hasCategories,
      icon: Tags,
      label: "Set up budget categories",
      description: "Add categories to organize your spending",
      href: "/projects",
    },
    {
      done: hasInvoices,
      icon: Upload,
      label: "Upload your first invoice",
      description: "Upload a PDF or enter details manually",
      href: "/invoices/upload",
    },
    {
      done: false,
      icon: Sparkles,
      label: "Let AI categorize spending",
      description: "Auto-categorize invoices with AI",
      href: "/settings/ai",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-brand-50 to-cream-100 rounded-2xl border border-brand-200 p-6 mb-8">
      <h3 className="text-xl font-bold text-charcoal-900 mb-1">
        Get started with your project
      </h3>
      <p className="text-charcoal-600 mb-5">
        Complete these steps to start tracking invoices.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <Link
              key={i}
              href={step.href}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                step.done
                  ? "bg-success-50 border-success-200"
                  : "bg-white border-charcoal-100 hover:border-brand-300"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  step.done ? "bg-success-100" : "bg-brand-100"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    step.done ? "text-success-600" : "text-brand-600"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-base ${
                    step.done
                      ? "text-success-700 line-through"
                      : "text-charcoal-900"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-sm text-charcoal-500">{step.description}</p>
              </div>
              {!step.done && (
                <ArrowRight className="w-4 h-4 text-charcoal-400 mt-1 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

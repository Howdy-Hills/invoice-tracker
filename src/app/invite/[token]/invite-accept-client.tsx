"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Shield } from "lucide-react";
import { acceptInvite } from "@/actions/members";

interface InviteAcceptClientProps {
  token: string;
  orgName: string;
  roleLabel: string;
  inviteEmail: string;
  userEmail: string;
}

export function InviteAcceptClient({
  token,
  orgName,
  roleLabel,
  inviteEmail,
  userEmail,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    setError(null);

    const result = await acceptInvite(token);
    if (result.errors) {
      setError(result.errors.general);
      setAccepting(false);
    } else {
      setAccepted(true);
      // Short delay then redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-8 max-w-md w-full text-center">
      {accepted ? (
        <>
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success-600" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
            Welcome!
          </h1>
          <p className="text-lg text-charcoal-600">
            You&apos;ve joined <strong>{orgName}</strong>. Redirecting to the
            dashboard...
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-lg text-charcoal-600 mb-6">
            You&apos;ve been invited to join{" "}
            <strong>{orgName}</strong> as a{" "}
            <strong>{roleLabel}</strong>.
          </p>

          {inviteEmail &&
            userEmail &&
            inviteEmail.toLowerCase() !== userEmail.toLowerCase() && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-warning-50 text-warning-700 border border-warning-200 text-sm">
                This invite was sent to <strong>{inviteEmail}</strong> but
                you&apos;re signed in as <strong>{userEmail}</strong>. You can
                still accept it.
              </div>
            )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg min-h-[44px] disabled:opacity-50"
          >
            {accepting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            Accept Invite
          </button>

          <p className="text-sm text-charcoal-500 mt-4">
            Signed in as {userEmail}
          </p>
        </>
      )}
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/lib/roles";
import { InviteAcceptClient } from "./invite-accept-client";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Look up invite
  const invite = await prisma.orgInvite.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
    },
  });

  if (!invite) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
            Invite Not Found
          </h1>
          <p className="text-base text-charcoal-600">
            This invite link is invalid or has been revoked.
          </p>
        </div>
      </div>
    );
  }

  // Check if expired
  if (invite.status === "accepted") {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
            Already Accepted
          </h1>
          <p className="text-base text-charcoal-600">
            This invite has already been accepted.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-6 px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (invite.status === "expired" || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
            Invite Expired
          </h1>
          <p className="text-base text-charcoal-600">
            This invite has expired. Please ask the organization owner to send a
            new one.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const roleLabel = ROLES[invite.role as Role]?.label ?? invite.role;

  if (!authUser) {
    // Not logged in — show sign up / sign in options
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-charcoal-900 mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-lg text-charcoal-600 mb-6">
            You&apos;ve been invited to join{" "}
            <strong>{invite.organization.name}</strong> as a{" "}
            <strong>{roleLabel}</strong>.
          </p>
          <p className="text-base text-charcoal-600 mb-6">
            Sign in or create an account to accept this invite.
          </p>
          <div className="space-y-3">
            <a
              href={`/sign-in?redirect=/invite/${token}`}
              className="block w-full px-6 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-lg"
            >
              Sign In
            </a>
            <a
              href={`/sign-up?redirect=/invite/${token}`}
              className="block w-full px-6 py-3 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors text-lg"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in — show accept button
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <InviteAcceptClient
        token={token}
        orgName={invite.organization.name}
        roleLabel={roleLabel}
        inviteEmail={invite.email}
        userEmail={authUser.email ?? ""}
      />
    </div>
  );
}

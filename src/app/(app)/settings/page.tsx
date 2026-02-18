import Link from "next/link";
import { Settings, Sparkles, ChevronRight } from "lucide-react";
import { getCurrentUser, getOrgName } from "@/lib/auth";
import { getOrgMembers, getPendingInvites } from "@/queries/members";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const { orgId, role, authUser } = await getCurrentUser();
  const [orgName, members, invites] = await Promise.all([
    getOrgName(orgId),
    getOrgMembers(orgId),
    getPendingInvites(orgId),
  ]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Settings className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-charcoal-900">Settings</h1>
          <p className="text-xl text-charcoal-600 mt-1">
            Configure your account and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Settings Client — org name, members, invites */}
        <SettingsClient
          orgName={orgName}
          role={role}
          currentUserEmail={authUser.email ?? ""}
          members={members.map((m) => ({
            id: m.id,
            userId: m.userId,
            email: m.email,
            role: m.role,
            createdAt: m.createdAt.toISOString(),
          }))}
          invites={invites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            token: i.token,
            expiresAt: i.expiresAt.toISOString(),
            isExpired: i.isExpired,
          }))}
        />

        {/* AI Settings Link */}
        <Link
          href="/settings/ai"
          className="block bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6 hover:border-brand-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-charcoal-900">
                  AI Settings
                </p>
                <p className="text-base text-charcoal-500">
                  Configure Gemini API key and auto-categorization
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-charcoal-400" />
          </div>
        </Link>
      </div>
    </div>
  );
}

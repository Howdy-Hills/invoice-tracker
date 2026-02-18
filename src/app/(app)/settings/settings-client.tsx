"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  UserPlus,
  Copy,
  Check,
  Loader2,
  Trash2,
  ChevronDown,
  Users,
  Building2,
  Clock,
  Shield,
  X,
} from "lucide-react";
import {
  updateOrgName,
  sendInvite,
  revokeInvite,
  changeMemberRole,
  removeMember,
} from "@/actions/members";
import { ROLES, type Role } from "@/lib/roles";

interface Member {
  id: string;
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  isExpired: boolean;
}

interface SettingsClientProps {
  orgName: string;
  role: Role;
  currentUserEmail: string;
  members: Member[];
  invites: Invite[];
}

export function SettingsClient({
  orgName: initialOrgName,
  role,
  currentUserEmail,
  members,
  invites,
}: SettingsClientProps) {
  const router = useRouter();
  const isOwner = role === "owner";

  // Org name state
  const [orgName, setOrgName] = useState(initialOrgName);
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Invite dialog
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "admin">("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Copied state for invite links
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Member action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // General error
  const [error, setError] = useState<string | null>(null);

  async function handleSaveOrgName() {
    setSavingName(true);
    setNameSuccess(false);
    const fd = new FormData();
    fd.set("name", orgName);
    const result = await updateOrgName(fd);
    if (result.errors) {
      setError(result.errors.general);
    } else {
      setNameSuccess(true);
      router.refresh();
      setTimeout(() => setNameSuccess(false), 2000);
    }
    setSavingName(false);
  }

  async function handleSendInvite() {
    setInviting(true);
    setInviteError(null);
    setInviteLink(null);

    const fd = new FormData();
    fd.set("email", inviteEmail);
    fd.set("role", inviteRole);

    const result = await sendInvite(fd);
    if (result.errors) {
      setInviteError(result.errors.general);
    } else if (result.inviteLink) {
      setInviteLink(result.inviteLink);
      router.refresh();
    }
    setInviting(false);
  }

  async function handleRevokeInvite(inviteId: string) {
    setActionLoading(inviteId);
    const result = await revokeInvite(inviteId);
    if (result.errors) {
      setError(result.errors.general);
    } else {
      router.refresh();
    }
    setActionLoading(null);
  }

  async function handleChangeRole(membershipId: string, newRole: string) {
    setActionLoading(membershipId);
    setOpenDropdown(null);
    const result = await changeMemberRole(membershipId, newRole);
    if (result.errors) {
      setError(result.errors.general);
    } else {
      router.refresh();
    }
    setActionLoading(null);
  }

  async function handleRemoveMember(membershipId: string) {
    setActionLoading(membershipId);
    setOpenDropdown(null);
    const result = await removeMember(membershipId);
    if (result.errors) {
      setError(result.errors.general);
    } else {
      router.refresh();
    }
    setActionLoading(null);
  }

  function copyToClipboard(text: string, token: string) {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 font-semibold text-base">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-danger-500 hover:text-danger-700"
          >
            <X className="w-4 h-4 inline" />
          </button>
        </div>
      )}

      {/* Organization Name */}
      {isOwner && (
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-charcoal-400" />
            <h2 className="text-xl font-bold text-charcoal-900">General</h2>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-base font-semibold text-charcoal-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
              />
            </div>
            <button
              onClick={handleSaveOrgName}
              disabled={savingName}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors min-h-[44px] disabled:opacity-50"
            >
              {savingName ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : nameSuccess ? (
                <Check className="w-5 h-5" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {nameSuccess ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-charcoal-400" />
            <h2 className="text-xl font-bold text-charcoal-900">Members</h2>
          </div>
          {isOwner && (
            <button
              onClick={() => {
                setShowInviteDialog(true);
                setInviteEmail("");
                setInviteRole("viewer");
                setInviteLink(null);
                setInviteError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors text-base min-h-[44px]"
            >
              <UserPlus className="w-5 h-5" />
              Invite Member
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-200 bg-cream-50">
                <th className="py-3 px-6 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Email
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Role
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                  Joined
                </th>
                {isOwner && (
                  <th className="py-3 px-6 text-right text-sm font-semibold text-charcoal-600 uppercase tracking-wide">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isCurrentUser = m.email === currentUserEmail;
                const isMemberOwner = m.role === "owner";
                return (
                  <tr
                    key={m.id}
                    className="border-b border-charcoal-100"
                  >
                    <td className="py-4 px-6">
                      <span className="text-base font-semibold text-charcoal-900">
                        {m.email}
                      </span>
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-charcoal-500">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                          m.role === "owner"
                            ? "bg-brand-100 text-brand-700"
                            : m.role === "admin"
                            ? "bg-warning-100 text-warning-700"
                            : "bg-charcoal-100 text-charcoal-700"
                        }`}
                      >
                        {ROLES[m.role as Role]?.label ?? m.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-base text-charcoal-600">
                      {new Date(m.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    {isOwner && (
                      <td className="py-4 px-6 text-right">
                        {!isCurrentUser && !isMemberOwner && (
                          <div className="relative inline-block">
                            {actionLoading === m.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-charcoal-400" />
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    setOpenDropdown(
                                      openDropdown === m.id ? null : m.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-charcoal-600 hover:bg-charcoal-100 transition-colors text-sm font-semibold min-h-[44px]"
                                >
                                  Actions
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                {openDropdown === m.id && (
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-charcoal-200 rounded-xl shadow-lg z-10 min-w-[160px]">
                                    <button
                                      onClick={() =>
                                        handleChangeRole(
                                          m.id,
                                          m.role === "admin"
                                            ? "viewer"
                                            : "admin"
                                        )
                                      }
                                      className="block w-full text-left px-4 py-3 text-base hover:bg-cream-50 transition-colors"
                                    >
                                      Make{" "}
                                      {m.role === "admin" ? "Viewer" : "Admin"}
                                    </button>
                                    <button
                                      onClick={() => handleRemoveMember(m.id)}
                                      className="block w-full text-left px-4 py-3 text-base text-danger-600 hover:bg-danger-50 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites */}
      {isOwner && invites.length > 0 && (
        <div className="bg-white rounded-2xl border border-charcoal-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-charcoal-200 flex items-center gap-3">
            <Clock className="w-5 h-5 text-charcoal-400" />
            <h2 className="text-xl font-bold text-charcoal-900">
              Pending Invites
            </h2>
          </div>
          <div className="divide-y divide-charcoal-100">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-charcoal-900">
                    {inv.email}
                  </p>
                  <p className="text-sm text-charcoal-500">
                    {ROLES[inv.role as Role]?.label ?? inv.role} &middot;
                    {inv.isExpired ? (
                      <span className="text-danger-600 font-semibold">
                        {" "}
                        Expired
                      </span>
                    ) : (
                      <>
                        {" "}
                        Expires{" "}
                        {new Date(inv.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!inv.isExpired && (
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/invite/${inv.token}`,
                          inv.token
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-charcoal-600 hover:bg-charcoal-100 transition-colors text-sm font-semibold min-h-[44px]"
                    >
                      {copiedToken === inv.token ? (
                        <Check className="w-4 h-4 text-success-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedToken === inv.token ? "Copied" : "Copy Link"}
                    </button>
                  )}
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    disabled={actionLoading === inv.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors text-sm font-semibold min-h-[44px] disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Dialog Overlay */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-charcoal-900">
                Invite Member
              </h3>
              <button
                onClick={() => setShowInviteDialog(false)}
                className="p-2 rounded-lg hover:bg-charcoal-100 text-charcoal-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-danger-50 text-danger-700 border border-danger-200 text-sm font-semibold">
                {inviteError}
              </div>
            )}

            {!inviteLink ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-semibold text-charcoal-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-charcoal-200 bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-charcoal-700 mb-2">
                      Role
                    </label>
                    <div className="space-y-2">
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          inviteRole === "viewer"
                            ? "border-brand-400 bg-brand-50"
                            : "border-charcoal-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="invite-role"
                          checked={inviteRole === "viewer"}
                          onChange={() => setInviteRole("viewer")}
                          className="mt-0.5 w-5 h-5 accent-brand-600"
                        />
                        <div>
                          <p className="font-semibold text-charcoal-900">
                            Viewer
                          </p>
                          <p className="text-sm text-charcoal-500">
                            Read-only access to dashboard, invoices, and exports
                          </p>
                        </div>
                      </label>
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          inviteRole === "admin"
                            ? "border-brand-400 bg-brand-50"
                            : "border-charcoal-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="invite-role"
                          checked={inviteRole === "admin"}
                          onChange={() => setInviteRole("admin")}
                          className="mt-0.5 w-5 h-5 accent-brand-600"
                        />
                        <div>
                          <p className="font-semibold text-charcoal-900">
                            Admin
                          </p>
                          <p className="text-sm text-charcoal-500">
                            Can manage projects, invoices, and vendors
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1 px-5 py-3 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors text-base min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={inviting || !inviteEmail}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-2xl font-semibold hover:bg-brand-700 transition-colors text-base min-h-[44px] disabled:opacity-50"
                  >
                    {inviting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                    Create Invite
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-base text-charcoal-700 mb-3">
                    Share this link with{" "}
                    <strong>{inviteEmail}</strong>. It expires in 7 days.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-charcoal-200 bg-cream-50 text-charcoal-700 text-sm min-h-[44px] font-mono"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(inviteLink, "invite-dialog")
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors min-h-[44px]"
                    >
                      {copiedToken === "invite-dialog" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                      {copiedToken === "invite-dialog" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteDialog(false)}
                  className="w-full px-5 py-3 bg-charcoal-100 text-charcoal-900 rounded-2xl font-semibold hover:bg-charcoal-200 transition-colors text-base min-h-[44px]"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

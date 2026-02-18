/**
 * Role definitions and permission helpers.
 * Three roles: owner (full access), admin (everything except org management), viewer (read-only).
 */

export const ROLES = {
  owner: {
    label: "Owner",
    description:
      "Full access. Can manage members and delete the organization.",
    permissions: ["*"], // wildcard — everything
  },
  admin: {
    label: "Admin",
    description:
      "Can manage projects, invoices, and exports. Cannot manage members or delete the org.",
    permissions: [
      "projects:read",
      "projects:write",
      "invoices:read",
      "invoices:write",
      "categories:read",
      "categories:write",
      "vendors:read",
      "vendors:write",
      "exports:read",
      "dashboard:read",
      "ai_settings:read",
      "ai_settings:write",
    ],
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to dashboard, invoices, and exports.",
    permissions: [
      "projects:read",
      "invoices:read",
      "categories:read",
      "vendors:read",
      "exports:read",
      "dashboard:read",
    ],
  },
} as const;

export type Role = keyof typeof ROLES;

export function hasPermission(role: string, permission: string): boolean {
  const roleConfig = ROLES[role as Role];
  if (!roleConfig) return false;
  if ((roleConfig.permissions as readonly string[]).includes("*")) return true;
  return (roleConfig.permissions as readonly string[]).includes(permission);
}

export function canWrite(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: string): boolean {
  return role === "owner";
}

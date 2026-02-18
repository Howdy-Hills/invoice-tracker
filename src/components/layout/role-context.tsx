"use client";

import { createContext, useContext } from "react";

type Role = "owner" | "admin" | "viewer";

const RoleContext = createContext<Role>("viewer");

export function RoleProvider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole(): Role {
  return useContext(RoleContext);
}

export function useCanWrite(): boolean {
  const role = useRole();
  return role === "owner" || role === "admin";
}

export function useIsOwner(): boolean {
  return useRole() === "owner";
}

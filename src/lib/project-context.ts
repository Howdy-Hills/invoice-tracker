import { cookies } from "next/headers";

const COOKIE_NAME = "selectedProjectId";

export async function getSelectedProjectId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function setSelectedProjectId(projectId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, projectId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

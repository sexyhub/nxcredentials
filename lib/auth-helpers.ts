import { headers } from "next/headers";
import { auth } from "./auth";

export async function getAuthSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return null;
  }
  return session;
}

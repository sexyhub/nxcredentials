import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: number;
  unlockedVaults?: Record<number, number>;
}

const DEFAULT_MAX_AGE = 24 * 60 * 60;
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;

function getSessionOptions(maxAge?: number) {
  return {
    password:
      process.env.SESSION_SECRET ||
      "credential-vault-secret-key-minimum-32-characters-long",
    cookieName: "credential_vault_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: maxAge ?? DEFAULT_MAX_AGE,
      sameSite: "lax" as const,
    },
  };
}

export async function getSession(rememberMe?: boolean): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const maxAge = rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE;
  return getIronSession<SessionData>(cookieStore, getSessionOptions(maxAge));
}

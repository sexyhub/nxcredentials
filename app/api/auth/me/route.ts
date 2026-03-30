import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: session.user.id,
    username: (session.user as any).username || session.user.name,
    isAdmin: (session.user as any).isAdmin || false,
  });
}

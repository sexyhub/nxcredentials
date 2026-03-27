import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  });
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getSession } from "@/lib/session";
import { getOrCreateSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const settings = await getOrCreateSettings();
  const existingUsers = await db.select().from(usersTable);

  if (existingUsers.length > 0 && !settings.registrationEnabled) {
    return NextResponse.json({ error: "Registration is currently disabled" }, { status: 403 });
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existing.length > 0) {
    return NextResponse.json({ error: "Username already taken" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isFirstUser = existingUsers.length === 0;

  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, isAdmin: isFirstUser })
    .returning();

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json({
    user: { id: user.id, username: user.username, isAdmin: user.isAdmin },
  }, { status: 201 });
}

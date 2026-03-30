import { NextRequest, NextResponse } from "next/server";
import { db, user as userTable } from "@/db";
import { auth } from "@/lib/auth";
import { getOrCreateSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const settings = await getOrCreateSettings();
  const existingUsers = await db.select({ id: userTable.id }).from(userTable).limit(1);

  if (existingUsers.length > 0 && !settings.registrationEnabled) {
    return NextResponse.json({ error: "Registration is currently disabled" }, { status: 403 });
  }

  try {
    const response = await auth.api.signUpEmail({
      body: {
        email: `${username.toLowerCase()}@vault.local`,
        password,
        name: username,
        username,
      },
      headers: req.headers,
      asResponse: true,
    });

    return response;
  } catch (error: any) {
    const message = error?.message || "Registration failed";
    if (message.includes("already") || message.includes("unique")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

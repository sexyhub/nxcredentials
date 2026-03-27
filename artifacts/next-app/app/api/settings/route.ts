import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, usersTable, settingsTable } from "@workspace/db";
import { getSession } from "@/lib/session";
import { getOrCreateSettings } from "@/lib/settings";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const settings = await getOrCreateSettings();
  return NextResponse.json({
    registrationEnabled: settings.registrationEnabled,
    siteTitle: settings.siteTitle,
    siteDescription: settings.siteDescription,
    siteLogo: settings.siteLogo,
    siteFavicon: settings.siteFavicon,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const settings = await getOrCreateSettings();

  const updateData: Record<string, any> = {};
  if (body.registrationEnabled !== undefined) updateData.registrationEnabled = body.registrationEnabled;
  if (body.siteTitle !== undefined) updateData.siteTitle = body.siteTitle;
  if (body.siteDescription !== undefined) updateData.siteDescription = body.siteDescription;
  if (body.siteLogo !== undefined) updateData.siteLogo = body.siteLogo;
  if (body.siteFavicon !== undefined) updateData.siteFavicon = body.siteFavicon;

  const [updated] = await db
    .update(settingsTable)
    .set(updateData)
    .where(eq(settingsTable.id, settings.id))
    .returning();

  return NextResponse.json({
    registrationEnabled: updated.registrationEnabled,
    siteTitle: updated.siteTitle,
    siteDescription: updated.siteDescription,
    siteLogo: updated.siteLogo,
    siteFavicon: updated.siteFavicon,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, spacesTable, credentialsTable } from "@/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.userId;

  const spaces = await db
    .select({
      id: spacesTable.id,
      name: spacesTable.name,
      defaultType: spacesTable.defaultType,
      color: spacesTable.color,
      icon: spacesTable.icon,
      credentialCount: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(spacesTable)
    .leftJoin(credentialsTable, eq(spacesTable.id, credentialsTable.spaceId))
    .where(eq(spacesTable.userId, userId))
    .groupBy(spacesTable.id)
    .orderBy(spacesTable.createdAt);

  return NextResponse.json(spaces);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const userId = session.userId;

  const [space] = await db
    .insert(spacesTable)
    .values({
      name: body.name,
      defaultType: body.defaultType ?? null,
      color: body.color || "#6366f1",
      icon: body.icon || "folder",
      userId,
    })
    .returning();

  return NextResponse.json({
    id: space.id,
    name: space.name,
    defaultType: space.defaultType,
    color: space.color,
    icon: space.icon,
    credentialCount: 0,
  }, { status: 201 });
}

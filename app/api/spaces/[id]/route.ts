import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db, spacesTable, credentialsTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const spaceId = Number(id);
  const body = await req.json();
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.id, spaceId), eq(spacesTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.defaultType !== undefined) updateData.defaultType = body.defaultType;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.icon !== undefined) updateData.icon = body.icon;

  const [space] = await db
    .update(spacesTable)
    .set(updateData)
    .where(eq(spacesTable.id, spaceId))
    .returning();

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.spaceId, space.id));

  return NextResponse.json({
    id: space.id,
    name: space.name,
    defaultType: space.defaultType,
    color: space.color,
    icon: space.icon,
    credentialCount: countResult?.count ?? 0,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const spaceId = Number(id);
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.id, spaceId), eq(spacesTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  await db.delete(spacesTable).where(eq(spacesTable.id, spaceId));
  return new NextResponse(null, { status: 204 });
}

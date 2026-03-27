import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db, tagsTable, credentialsTable } from "@workspace/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const tagId = Number(id);
  const body = await req.json();
  const userId = session.userId;

  const [existing] = await db
    .select()
    .from(tagsTable)
    .where(and(eq(tagsTable.id, tagId), eq(tagsTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.color !== undefined) updateData.color = body.color;

  const [tag] = await db
    .update(tagsTable)
    .set(updateData)
    .where(eq(tagsTable.id, tagId))
    .returning();

  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.tagId, tag.id));

  return NextResponse.json({ ...tag, credentialCount: countResult[0]?.count ?? 0 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const tagId = Number(id);
  const userId = session.userId;

  const [existing] = await db
    .select()
    .from(tagsTable)
    .where(and(eq(tagsTable.id, tagId), eq(tagsTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await db.delete(tagsTable).where(eq(tagsTable.id, tagId));
  return new NextResponse(null, { status: 204 });
}

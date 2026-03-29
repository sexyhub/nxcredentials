import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, credentialsTable, tagsTable, spacesTable } from "@/db";
import { getSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const credId = Number(id);
  const body = await req.json();
  const userId = session.userId;

  const [existing] = await db
    .select()
    .from(credentialsTable)
    .where(and(eq(credentialsTable.id, credId), eq(credentialsTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  const updateData: Record<string, any> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.password !== undefined) updateData.password = body.password;
  if (body.tagId !== undefined) updateData.tagId = body.tagId;
  if (body.vaultId !== undefined) updateData.vaultId = body.vaultId;
  if (body.spaceId !== undefined) updateData.spaceId = body.spaceId;

  const [credential] = await db
    .update(credentialsTable)
    .set(updateData)
    .where(eq(credentialsTable.id, credId))
    .returning();

  let tagName: string | null = null;
  let tagColor: string | null = null;
  if (credential.tagId) {
    const [t] = await db.select().from(tagsTable).where(eq(tagsTable.id, credential.tagId));
    if (t) { tagName = t.name; tagColor = t.color; }
  }

  let spaceName: string | null = null;
  if (credential.spaceId) {
    const [sp] = await db.select().from(spacesTable).where(eq(spacesTable.id, credential.spaceId));
    if (sp) spaceName = sp.name;
  }

  return NextResponse.json({ ...credential, tagName, tagColor, spaceName });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const credId = Number(id);
  const userId = session.userId;

  const [existing] = await db
    .select()
    .from(credentialsTable)
    .where(and(eq(credentialsTable.id, credId), eq(credentialsTable.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  await db.delete(credentialsTable).where(eq(credentialsTable.id, credId));
  return new NextResponse(null, { status: 204 });
}

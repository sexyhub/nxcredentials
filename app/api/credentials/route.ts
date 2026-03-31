import { NextRequest, NextResponse } from "next/server";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { db, credentialsTable, tagsTable, spacesTable, vaultsTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { getVaultUnlockState } from "@/lib/vault-state";
import { isVaultUnlocked } from "@/lib/vault-helpers";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;
  const vaultState = await getVaultUnlockState(userId);
  const url = new URL(req.url);
  const tag = url.searchParams.get("tag");
  const search = url.searchParams.get("search");
  const spaceId = url.searchParams.get("spaceId");
  const vaultId = url.searchParams.get("vaultId");

  let query = db
    .select({
      id: credentialsTable.id,
      title: credentialsTable.title,
      email: credentialsTable.email,
      password: credentialsTable.password,
      tagId: credentialsTable.tagId,
      tagName: tagsTable.name,
      tagColor: tagsTable.color,
      vaultId: credentialsTable.vaultId,
      spaceId: credentialsTable.spaceId,
      spaceName: spacesTable.name,
      createdAt: credentialsTable.createdAt,
      updatedAt: credentialsTable.updatedAt,
    })
    .from(credentialsTable)
    .leftJoin(tagsTable, eq(credentialsTable.tagId, tagsTable.id))
    .leftJoin(spacesTable, eq(credentialsTable.spaceId, spacesTable.id))
    .where(eq(credentialsTable.userId, userId))
    .$dynamic();

  if (tag) {
    query = query.where(and(eq(credentialsTable.userId, userId), eq(tagsTable.name, tag)));
  }

  if (search) {
    const s = `%${search}%`;
    query = query.where(
      and(eq(credentialsTable.userId, userId), or(ilike(credentialsTable.title, s), ilike(credentialsTable.email, s)))
    );
  }

  if (spaceId) {
    query = query.where(and(eq(credentialsTable.userId, userId), eq(credentialsTable.spaceId, Number(spaceId))));
  }

  if (vaultId) {
    query = query.where(and(eq(credentialsTable.userId, userId), eq(credentialsTable.vaultId, Number(vaultId))));
  }

  const results = await query.orderBy(credentialsTable.createdAt);

  const masked = results.map((cred) => {
    if (cred.vaultId && !isVaultUnlocked(vaultState, cred.vaultId)) {
      return { ...cred, email: "••••••••", password: "••••••••" };
    }
    return { ...cred, email: decrypt(cred.email), password: decrypt(cred.password) };
  });

  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const userId = session.user.id;

  if (body.tagId) {
    const [tag] = await db.select().from(tagsTable).where(and(eq(tagsTable.id, body.tagId), eq(tagsTable.userId, userId)));
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 400 });
  }
  if (body.spaceId) {
    const [space] = await db.select().from(spacesTable).where(and(eq(spacesTable.id, body.spaceId), eq(spacesTable.userId, userId)));
    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 400 });
  }
  if (body.vaultId) {
    const [vault] = await db.select().from(vaultsTable).where(and(eq(vaultsTable.id, body.vaultId), eq(vaultsTable.userId, userId)));
    if (!vault) return NextResponse.json({ error: "Vault not found" }, { status: 400 });
  }

  const [credential] = await db
    .insert(credentialsTable)
    .values({
      title: body.title,
      email: encrypt(body.email),
      password: encrypt(body.password),
      tagId: body.tagId ?? null,
      vaultId: body.vaultId ?? null,
      spaceId: body.spaceId ?? null,
      userId,
    })
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

  return NextResponse.json({ ...credential, email: decrypt(credential.email), password: decrypt(credential.password), tagName, tagColor, spaceName }, { status: 201 });
}

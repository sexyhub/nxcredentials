import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, credentialsTable, tagsTable, spacesTable, vaultsTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { decrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "global";
  const scopeId = url.searchParams.get("id") ? Number(url.searchParams.get("id")) : undefined;

  let baseQuery = db
    .select({
      id: credentialsTable.id,
      title: credentialsTable.title,
      email: credentialsTable.email,
      password: credentialsTable.password,
      tagName: tagsTable.name,
      tagColor: tagsTable.color,
      spaceName: spacesTable.name,
      vaultName: vaultsTable.name,
      createdAt: credentialsTable.createdAt,
      updatedAt: credentialsTable.updatedAt,
    })
    .from(credentialsTable)
    .leftJoin(tagsTable, eq(credentialsTable.tagId, tagsTable.id))
    .leftJoin(spacesTable, eq(credentialsTable.spaceId, spacesTable.id))
    .leftJoin(vaultsTable, eq(credentialsTable.vaultId, vaultsTable.id))
    .$dynamic();

  if (scope === "space" && scopeId !== undefined) {
    const [space] = await db.select().from(spacesTable).where(and(eq(spacesTable.id, scopeId), eq(spacesTable.userId, userId)));
    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
    baseQuery = baseQuery.where(and(eq(credentialsTable.userId, userId), eq(credentialsTable.spaceId, scopeId)));
  } else if (scope === "vault" && scopeId !== undefined) {
    const [vault] = await db.select().from(vaultsTable).where(and(eq(vaultsTable.id, scopeId), eq(vaultsTable.userId, userId)));
    if (!vault) return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    baseQuery = baseQuery.where(and(eq(credentialsTable.userId, userId), eq(credentialsTable.vaultId, scopeId)));
  } else {
    baseQuery = baseQuery.where(eq(credentialsTable.userId, userId));
  }

  const rows = await baseQuery.orderBy(credentialsTable.createdAt);

  const credentials = rows.map((row) => ({
    title: row.title,
    email: decrypt(row.email),
    password: decrypt(row.password),
    tagName: row.tagName ?? null,
    tagColor: row.tagColor ?? null,
    spaceName: row.spaceName ?? null,
    vaultName: row.vaultName ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    scope,
    scopeId: scopeId ?? null,
    count: credentials.length,
    credentials,
  };

  const filename = `credential-vault-export-${scope}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

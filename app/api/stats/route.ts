import { NextResponse } from "next/server";
import { eq, sql, gte, and, isNotNull } from "drizzle-orm";
import { db, credentialsTable, tagsTable, spacesTable, vaultsTable, serviceTypesTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const totalCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId));

  const totalTagsResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tagsTable)
    .where(eq(tagsTable.userId, userId));

  const totalSpacesResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(spacesTable)
    .where(eq(spacesTable.userId, userId));

  const totalVaultsResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(vaultsTable)
    .where(eq(vaultsTable.userId, userId));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(and(eq(credentialsTable.userId, userId), gte(credentialsTable.createdAt, sevenDaysAgo)));

  const vaultCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(and(eq(credentialsTable.userId, userId), isNotNull(credentialsTable.vaultId)));

  const spaceCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(and(eq(credentialsTable.userId, userId), isNotNull(credentialsTable.spaceId)));

  const taggedCreds = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(credentialsTable)
    .where(and(eq(credentialsTable.userId, userId), isNotNull(credentialsTable.tagId)));

  const uniqueTypesResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(serviceTypesTable);

  const ageStats = await db
    .select({
      oldest: sql<number>`cast(coalesce(extract(epoch from (now() - min(${credentialsTable.createdAt}))) / 86400, 0) as integer)`,
      avgAge: sql<number>`cast(coalesce(avg(extract(epoch from (now() - ${credentialsTable.createdAt})) / 86400), 0) as integer)`,
    })
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId));

  const breakdown = await db
    .select({
      name: tagsTable.name,
      color: tagsTable.color,
      count: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(tagsTable)
    .leftJoin(
      credentialsTable,
      and(eq(tagsTable.id, credentialsTable.tagId), eq(credentialsTable.userId, userId))
    )
    .where(eq(tagsTable.userId, userId))
    .groupBy(tagsTable.id)
    .orderBy(tagsTable.name);

  const typeBreakdown = await db
    .select({
      type: credentialsTable.title,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(credentialsTable)
    .where(eq(credentialsTable.userId, userId))
    .groupBy(credentialsTable.title)
    .orderBy(sql`count(*) desc`);

  const spaceBreakdown = await db
    .select({
      name: spacesTable.name,
      color: spacesTable.color,
      icon: spacesTable.icon,
      count: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(spacesTable)
    .leftJoin(
      credentialsTable,
      and(eq(spacesTable.id, credentialsTable.spaceId), eq(credentialsTable.userId, userId))
    )
    .where(eq(spacesTable.userId, userId))
    .groupBy(spacesTable.id)
    .orderBy(sql`count(${credentialsTable.id}) desc`);

  const totalCount = totalCreds[0]?.count ?? 0;
  const oldestDays = totalCount > 0 ? (ageStats[0]?.oldest ?? null) : null;

  return NextResponse.json({
    totalCredentials: totalCount,
    totalTags: totalTagsResult[0]?.count ?? 0,
    totalSpaces: totalSpacesResult[0]?.count ?? 0,
    totalVaults: totalVaultsResult[0]?.count ?? 0,
    recentlyAdded: recentCreds[0]?.count ?? 0,
    vaultCredentials: vaultCreds[0]?.count ?? 0,
    spaceCredentials: spaceCreds[0]?.count ?? 0,
    taggedCredentials: taggedCreds[0]?.count ?? 0,
    uniqueTypes: uniqueTypesResult[0]?.count ?? 0,
    oldestCredentialDays: oldestDays,
    averageAgeDays: ageStats[0]?.avgAge ?? 0,
    tagBreakdown: breakdown,
    typeBreakdown: typeBreakdown,
    spaceBreakdown: spaceBreakdown,
  });
}

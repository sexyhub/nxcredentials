import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db, tagsTable, credentialsTable } from "@/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.userId;

  const results = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
      credentialCount: sql<number>`cast(count(${credentialsTable.id}) as integer)`,
    })
    .from(tagsTable)
    .leftJoin(credentialsTable, eq(tagsTable.id, credentialsTable.tagId))
    .where(eq(tagsTable.userId, userId))
    .groupBy(tagsTable.id)
    .orderBy(tagsTable.name);

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const userId = session.userId;

  const [tag] = await db
    .insert(tagsTable)
    .values({ name: body.name, color: body.color, userId })
    .returning();

  return NextResponse.json({ ...tag, credentialCount: 0 }, { status: 201 });
}

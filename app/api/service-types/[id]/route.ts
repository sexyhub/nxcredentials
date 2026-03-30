import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, serviceTypesTable } from "@/db";
import { getAuthSession } from "@/lib/auth-helpers";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const stId = Number(id);
  if (isNaN(stId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json();

  if (body.label !== undefined && (typeof body.label !== "string" || body.label.length < 1 || body.label.length > 64))
    return NextResponse.json({ error: "label must be 1-64 characters" }, { status: 400 });
  if (body.icon !== undefined && (typeof body.icon !== "string" || body.icon.length < 1 || body.icon.length > 64))
    return NextResponse.json({ error: "icon must be a valid icon name" }, { status: 400 });
  if (body.color !== undefined && (typeof body.color !== "string" || !COLOR_RE.test(body.color)))
    return NextResponse.json({ error: "color must be a hex color like #RRGGBB" }, { status: 400 });

  const [existing] = await db
    .select()
    .from(serviceTypesTable)
    .where(eq(serviceTypesTable.id, stId));

  if (!existing) {
    return NextResponse.json({ error: "Service type not found" }, { status: 404 });
  }

  const updateData: Record<string, string> = {};
  if (body.label !== undefined) updateData.label = body.label;
  if (body.icon !== undefined) updateData.icon = body.icon;
  if (body.color !== undefined) updateData.color = body.color;

  const [updated] = await db
    .update(serviceTypesTable)
    .set(updateData)
    .where(eq(serviceTypesTable.id, stId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const stId = Number(id);
  if (isNaN(stId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(serviceTypesTable)
    .where(eq(serviceTypesTable.id, stId));

  if (!existing) {
    return NextResponse.json({ error: "Service type not found" }, { status: 404 });
  }

  await db.delete(serviceTypesTable).where(eq(serviceTypesTable.id, stId));
  return new NextResponse(null, { status: 204 });
}

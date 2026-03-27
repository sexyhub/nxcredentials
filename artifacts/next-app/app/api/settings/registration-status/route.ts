import { NextResponse } from "next/server";
import { getOrCreateSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json({ enabled: settings.registrationEnabled });
}

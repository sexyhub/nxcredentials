import { NextResponse } from "next/server";
import { getOrCreateSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json({
    siteTitle: settings.siteTitle,
    siteDescription: settings.siteDescription,
    siteLogo: settings.siteLogo,
    siteFavicon: settings.siteFavicon,
  });
}

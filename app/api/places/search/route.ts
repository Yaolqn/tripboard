import { NextRequest, NextResponse } from "next/server";
import { isAmapConfigured, searchAmapPlaces } from "@/lib/amap-places";

const MAX_KEYWORDS_LENGTH = 100;

export async function GET(request: NextRequest) {
  const rawKeywords = request.nextUrl.searchParams.get("keywords")?.trim() ?? "";
  if (!rawKeywords) {
    return NextResponse.json({ places: [], configured: isAmapConfigured() });
  }
  if (rawKeywords.length > MAX_KEYWORDS_LENGTH) {
    return NextResponse.json({ error: "搜索内容过长" }, { status: 400 });
  }
  if (!isAmapConfigured()) {
    return NextResponse.json({ places: [], configured: false });
  }

  try {
    const places = await searchAmapPlaces(rawKeywords);
    return NextResponse.json({ places, configured: true });
  } catch {
    // Do not return upstream details: they may contain request metadata or secrets.
    return NextResponse.json({ error: "地点搜索暂时不可用，请稍后重试" }, { status: 502 });
  }
}

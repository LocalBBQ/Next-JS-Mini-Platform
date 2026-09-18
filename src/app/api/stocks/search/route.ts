import { NextRequest, NextResponse } from "next/server";
import { searchTickers } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTickers(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Could not search tickers." },
      { status: 502 },
    );
  }
}

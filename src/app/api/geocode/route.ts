import { NextRequest, NextResponse } from "next/server";
import { geocodeUrl, parseGeocode } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() || "";

  if (name.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const response = await fetch(geocodeUrl(name), {
    next: { revalidate: 3600, tags: ["geocode"] },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not search cities." },
      { status: 502 },
    );
  }

  const payload = await response.json();
  return NextResponse.json({ results: parseGeocode(payload) });
}

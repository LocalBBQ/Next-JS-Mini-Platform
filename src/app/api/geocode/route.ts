import { NextRequest } from "next/server";
import { jsonError } from "@/lib/route";
import {
  geocodeUrl,
  parseGeocode,
  parseReverseGeocode,
  reverseGeocodeUrl,
} from "@/lib/weather";

function readNumber(value: string | null) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const latitude = readNumber(request.nextUrl.searchParams.get("latitude"));
  const longitude = readNumber(request.nextUrl.searchParams.get("longitude"));

  try {
    if (latitude !== null && longitude !== null) {
      const response = await fetch(reverseGeocodeUrl(latitude, longitude), {
        next: { revalidate: 3600, tags: ["geocode"] },
      });

      if (!response.ok) {
        return jsonError("Could not resolve that location.", 502);
      }

      const payload = await response.json();
      const place = parseReverseGeocode(payload, { latitude, longitude });
      return Response.json({ results: place ? [place] : [] });
    }

    const name = request.nextUrl.searchParams.get("name")?.trim() || "";

    if (name.length < 2) {
      return Response.json({ results: [] });
    }

    const response = await fetch(geocodeUrl(name), {
      next: { revalidate: 3600, tags: ["geocode"] },
    });

    if (!response.ok) {
      return jsonError("Could not search cities.", 502);
    }

    const payload = await response.json();
    return Response.json({ results: parseGeocode(payload) });
  } catch {
    return jsonError("Could not search cities.", 502);
  }
}

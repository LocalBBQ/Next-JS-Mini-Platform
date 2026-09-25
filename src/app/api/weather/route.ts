import { NextRequest } from "next/server";
import { jsonError } from "@/lib/route";
import { forecastUrl, parseForecast } from "@/lib/weather";

function readNumber(value: string | null) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const latitude = readNumber(request.nextUrl.searchParams.get("latitude"));
  const longitude = readNumber(request.nextUrl.searchParams.get("longitude"));
  const name = request.nextUrl.searchParams.get("name")?.trim() || "Selected city";
  const state = request.nextUrl.searchParams.get("state")?.trim() || "";
  const country = request.nextUrl.searchParams.get("country")?.trim() || "";
  const id = request.nextUrl.searchParams.get("id")?.trim() || `${latitude},${longitude}`;

  if (latitude === null || longitude === null) {
    return jsonError("latitude and longitude are required.", 400);
  }

  try {
    const response = await fetch(forecastUrl(latitude, longitude), {
      next: { revalidate: 300, tags: ["weather"] },
    });

    if (!response.ok) {
      return jsonError("Could not load weather for that location.", 502);
    }

    const payload = await response.json();
    return Response.json(
      parseForecast(payload, {
        id,
        name,
        state,
        country,
        latitude,
        longitude,
      }),
    );
  } catch {
    return jsonError("Could not load weather for that location.", 502);
  }
}

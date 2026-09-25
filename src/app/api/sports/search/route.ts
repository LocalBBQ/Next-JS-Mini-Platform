import { NextRequest } from "next/server";
import { jsonError } from "@/lib/route";
import { searchTeams } from "@/lib/sports";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return Response.json({ results: [] });
  }

  try {
    const results = await searchTeams(query);
    return Response.json({ results });
  } catch {
    return jsonError("Could not search teams.", 502);
  }
}

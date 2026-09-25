import { NextRequest } from "next/server";
import { jsonError } from "@/lib/route";
import { isSportsLeague, parseScoreboard, scoreboardUrl } from "@/lib/sports";
import type { SportsTeam } from "@/lib/types";

export async function GET(request: NextRequest) {
  const leagueParam = request.nextUrl.searchParams.get("league")?.trim().toLowerCase() || "nba";

  if (!isSportsLeague(leagueParam)) {
    return jsonError("league must be nba, nfl, mlb, or nhl.", 400);
  }

  const featuredAbbr = request.nextUrl.searchParams.get("team")?.trim().toUpperCase() || "";
  const featured: SportsTeam | null = featuredAbbr
    ? {
        id: featuredAbbr,
        name: featuredAbbr,
        abbreviation: featuredAbbr,
        league: leagueParam,
      }
    : null;

  try {
    const response = await fetch(scoreboardUrl(leagueParam), {
      next: { revalidate: 60, tags: ["sports"] },
    });

    if (!response.ok) {
      return jsonError("Could not load that scoreboard.", 502);
    }

    const payload = await response.json();
    return Response.json({
      league: leagueParam,
      games: parseScoreboard(payload, featured),
    });
  } catch {
    return jsonError("Could not load that scoreboard.", 502);
  }
}

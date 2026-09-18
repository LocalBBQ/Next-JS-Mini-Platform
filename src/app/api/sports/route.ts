import { NextRequest, NextResponse } from "next/server";
import { isSportsLeague, parseScoreboard, scoreboardUrl } from "@/lib/sports";
import type { SportsTeam } from "@/lib/types";

export async function GET(request: NextRequest) {
  const leagueParam = request.nextUrl.searchParams.get("league")?.trim().toLowerCase() || "nba";

  if (!isSportsLeague(leagueParam)) {
    return NextResponse.json(
      { error: "league must be nba, nfl, mlb, or nhl." },
      { status: 400 },
    );
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

  const response = await fetch(scoreboardUrl(leagueParam), {
    next: { revalidate: 60, tags: ["sports"] },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not load that scoreboard." },
      { status: 502 },
    );
  }

  const payload = await response.json();
  return NextResponse.json({
    league: leagueParam,
    games: parseScoreboard(payload, featured),
  });
}

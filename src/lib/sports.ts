import type { SportsGame, SportsLeague, SportsTeam } from "./types";

export const SPORTS_LEAGUES: Record<
  SportsLeague,
  { sport: string; league: string; label: string }
> = {
  nba: { sport: "basketball", league: "nba", label: "NBA" },
  nfl: { sport: "football", league: "nfl", label: "NFL" },
  mlb: { sport: "baseball", league: "mlb", label: "MLB" },
  nhl: { sport: "hockey", league: "nhl", label: "NHL" },
};

type EspnScoreboard = {
  events?: Array<{
    id?: string;
    name?: string;
    shortName?: string;
    date?: string;
    status?: {
      type?: {
        state?: string;
        shortDetail?: string;
        detail?: string;
      };
    };
    competitions?: Array<{
      competitors?: Array<{
        homeAway?: string;
        score?: string;
        winner?: boolean;
        team?: {
          abbreviation?: string;
          displayName?: string;
          shortDisplayName?: string;
          logo?: string;
        };
      }>;
    }>;
  }>;
};

export function isSportsLeague(value: string | null): value is SportsLeague {
  return value === "nba" || value === "nfl" || value === "mlb" || value === "nhl";
}

export function scoreboardUrl(league: SportsLeague) {
  const config = SPORTS_LEAGUES[league];
  return `https://site.api.espn.com/apis/site/v2/sports/${config.sport}/${config.league}/scoreboard`;
}

function readState(value: string | undefined): SportsGame["state"] {
  if (value === "in" || value === "post") return value;
  return "pre";
}

export function parseScoreboard(
  payload: EspnScoreboard,
  featured?: SportsTeam | null,
): SportsGame[] {
  const featuredAbbr = featured?.abbreviation.toUpperCase();

  const games = (payload.events ?? [])
    .map((event): SportsGame | null => {
      const competitors = event.competitions?.[0]?.competitors ?? [];
      const home = competitors.find((team) => team.homeAway === "home");
      const away = competitors.find((team) => team.homeAway === "away");

      if (!home?.team?.abbreviation || !away?.team?.abbreviation) {
        return null;
      }

      const featuredMatch = Boolean(
        featuredAbbr &&
          (home.team.abbreviation.toUpperCase() === featuredAbbr ||
            away.team.abbreviation.toUpperCase() === featuredAbbr),
      );

      return {
        id: event.id || `${away.team.abbreviation}-${home.team.abbreviation}`,
        name: event.name || event.shortName || "Game",
        shortName: event.shortName || event.name || "Game",
        date: event.date || "",
        state: readState(event.status?.type?.state),
        status:
          event.status?.type?.shortDetail ||
          event.status?.type?.detail ||
          "Scheduled",
        featured: featuredMatch,
        home: {
          name: home.team.displayName || home.team.shortDisplayName || "Home",
          abbreviation: home.team.abbreviation,
          score: home.score || "0",
          winner: Boolean(home.winner),
          logo: home.team.logo || "",
        },
        away: {
          name: away.team.displayName || away.team.shortDisplayName || "Away",
          abbreviation: away.team.abbreviation,
          score: away.score || "0",
          winner: Boolean(away.winner),
          logo: away.team.logo || "",
        },
      };
    })
    .filter((game): game is SportsGame => game !== null);

  return games.sort((left, right) => Number(right.featured) - Number(left.featured));
}

type EspnTeamSearch = {
  items?: Array<{
    type?: string;
    displayName?: string;
    abbreviation?: string;
    league?: string;
  }>;
};

export async function searchTeams(query: string): Promise<SportsTeam[]> {
  const params = new URLSearchParams({
    query,
    limit: "8",
    type: "team",
  });
  const response = await fetch(
    `https://site.web.api.espn.com/apis/common/v3/search?${params.toString()}`,
    { next: { revalidate: 3600, tags: ["sports-search"] } },
  );

  if (!response.ok) {
    throw new Error("Could not search teams.");
  }

  const payload = (await response.json()) as EspnTeamSearch;
  const teams: SportsTeam[] = [];
  const seen = new Set<string>();

  for (const item of payload.items ?? []) {
    if (item.type !== "team") continue;
    const league = item.league?.trim().toLowerCase() ?? "";
    if (!isSportsLeague(league)) continue;
    const abbreviation = item.abbreviation?.trim().toUpperCase() ?? "";
    const name = item.displayName?.trim() ?? "";
    if (abbreviation.length < 2 || !name) continue;

    const id = `${league}-${abbreviation}`;
    if (seen.has(id)) continue;
    seen.add(id);
    teams.push({ id, name, abbreviation, league });
    if (teams.length >= 8) break;
  }

  return teams;
}

export function formatGameTime(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

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

export function formatGameTime(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

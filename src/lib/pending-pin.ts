import type { SportsLeague, SportsTeam, StockTicker, WeatherPlace } from "@/lib/types";

const KEY = "home-board-pending-pin";

export type PendingPin =
  | { kind: "location"; item: WeatherPlace }
  | { kind: "ticker"; item: StockTicker }
  | { kind: "team"; item: SportsTeam };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLeague(value: unknown): value is SportsLeague {
  return value === "nba" || value === "nfl" || value === "mlb" || value === "nhl";
}

function readPending(value: unknown): PendingPin | null {
  if (!isRecord(value)) return null;

  if (value.kind === "location" && isRecord(value.item)) {
    const item = value.item;
    if (typeof item.name !== "string" || typeof item.latitude !== "number" || typeof item.longitude !== "number") {
      return null;
    }
    return {
      kind: "location",
      item: {
        id: typeof item.id === "string" ? item.id : "",
        name: item.name,
        state: typeof item.state === "string" ? item.state : undefined,
        country: typeof item.country === "string" ? item.country : "",
        latitude: item.latitude,
        longitude: item.longitude,
      },
    };
  }

  if (value.kind === "ticker" && isRecord(value.item)) {
    const item = value.item;
    if (typeof item.symbol !== "string" || typeof item.name !== "string") return null;
    return {
      kind: "ticker",
      item: {
        id: typeof item.id === "string" ? item.id : item.symbol,
        symbol: item.symbol,
        name: item.name,
      },
    };
  }

  if (value.kind === "team" && isRecord(value.item) && isLeague(value.item.league)) {
    const item = value.item;
    if (typeof item.name !== "string" || typeof item.abbreviation !== "string") return null;
    return {
      kind: "team",
      item: {
        id: typeof item.id === "string" ? item.id : "",
        name: item.name,
        abbreviation: item.abbreviation,
        league: item.league,
      },
    };
  }

  return null;
}

export function stashPendingPin(pin: PendingPin) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(pin));
  } catch {
    // The pin still sends them to sign-in if storage is blocked.
  }
}

export function takePendingPin(): PendingPin | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    if (!raw) return null;
    return readPending(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

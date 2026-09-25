import { neon } from "@neondatabase/serverless";
import { isDatabaseConfigured } from "@/lib/auth-env";
import type {
  SportsLeague,
  SportsTeam,
  StockTicker,
  UserBoard,
  WeatherPlace,
} from "@/lib/types";

const MAX_ITEMS = 40;
const MAX_NOTE = 20_000;

type BoardRow = {
  user_id: string;
  locations: unknown;
  tickers: unknown;
  teams: unknown;
  note: string;
  updated_at: string | Date;
};

let tableReady = false;

function databaseUrl() {
  return (process.env.POSTGRES_URL || process.env.DATABASE_URL || "").trim();
}

function sql() {
  const url = databaseUrl();
  if (!url) {
    throw new Error("Postgres is not configured.");
  }
  return neon(url);
}

export async function ensureUserBoardsTable() {
  if (!isDatabaseConfigured) {
    throw new Error("Postgres is not configured.");
  }
  if (tableReady) return;

  await sql()`
    CREATE TABLE IF NOT EXISTS user_boards (
      user_id TEXT PRIMARY KEY,
      locations JSONB NOT NULL DEFAULT '[]'::jsonb,
      tickers JSONB NOT NULL DEFAULT '[]'::jsonb,
      teams JSONB NOT NULL DEFAULT '[]'::jsonb,
      note TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

function emptyBoard(userId: string): UserBoard {
  return {
    userId,
    locations: [],
    tickers: [],
    teams: [],
    note: "",
    updatedAt: new Date().toISOString(),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function readLeague(value: unknown): SportsLeague | null {
  if (value === "nba" || value === "nfl" || value === "mlb" || value === "nhl") {
    return value;
  }
  return null;
}

function parseLocations(value: unknown): WeatherPlace[] {
  if (!Array.isArray(value)) return [];
  const places: WeatherPlace[] = [];

  for (const item of value.slice(0, MAX_ITEMS)) {
    const record = asRecord(item);
    if (!record) continue;
    const name = readString(record.name);
    const latitude = readNumber(record.latitude);
    const longitude = readNumber(record.longitude);
    if (!name || latitude === null || longitude === null) continue;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      continue;
    }

    places.push({
      id: readString(record.id) || `${latitude},${longitude}`,
      name,
      state: readString(record.state) || undefined,
      country: readString(record.country),
      latitude,
      longitude,
      isDefault: Boolean(record.isDefault),
    });
  }

  return places;
}

function parseTickers(value: unknown): StockTicker[] {
  if (!Array.isArray(value)) return [];
  const tickers: StockTicker[] = [];

  for (const item of value.slice(0, MAX_ITEMS)) {
    const record = asRecord(item);
    if (!record) continue;
    const symbol = readString(record.symbol).toUpperCase();
    if (!/^[A-Z0-9.^+=-]{1,12}$/.test(symbol)) continue;

    tickers.push({
      id: readString(record.id) || symbol,
      symbol,
      name: readString(record.name) || symbol,
      isDefault: Boolean(record.isDefault),
    });
  }

  return tickers;
}

function parseTeams(value: unknown): SportsTeam[] {
  if (!Array.isArray(value)) return [];
  const teams: SportsTeam[] = [];

  for (const item of value.slice(0, MAX_ITEMS)) {
    const record = asRecord(item);
    if (!record) continue;
    const name = readString(record.name);
    const abbreviation = readString(record.abbreviation).toUpperCase();
    const league = readLeague(record.league);
    if (!name || abbreviation.length < 2 || abbreviation.length > 5 || !league) {
      continue;
    }

    teams.push({
      id: readString(record.id) || `${league}-${abbreviation}`,
      name,
      abbreviation,
      league,
      isDefault: Boolean(record.isDefault),
    });
  }

  return teams;
}

function parseNote(value: unknown) {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_NOTE);
}

function fromRow(row: BoardRow): UserBoard {
  return {
    userId: row.user_id,
    locations: parseLocations(row.locations),
    tickers: parseTickers(row.tickers),
    teams: parseTeams(row.teams),
    note: parseNote(row.note),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  };
}

export type UserBoardUpdate = {
  locations?: unknown;
  tickers?: unknown;
  teams?: unknown;
  note?: unknown;
};

export async function getUserBoard(userId: string): Promise<UserBoard> {
  await ensureUserBoardsTable();
  const rows = (await sql()`
    SELECT user_id, locations, tickers, teams, note, updated_at
    FROM user_boards
    WHERE user_id = ${userId}
    LIMIT 1
  `) as BoardRow[];

  return rows[0] ? fromRow(rows[0]) : emptyBoard(userId);
}

export async function saveUserBoard(
  userId: string,
  update: UserBoardUpdate,
): Promise<UserBoard> {
  const current = await getUserBoard(userId);
  const next: UserBoard = {
    userId,
    locations:
      update.locations === undefined
        ? current.locations
        : parseLocations(update.locations),
    tickers:
      update.tickers === undefined ? current.tickers : parseTickers(update.tickers),
    teams: update.teams === undefined ? current.teams : parseTeams(update.teams),
    note: update.note === undefined ? current.note : parseNote(update.note),
    updatedAt: new Date().toISOString(),
  };

  await sql()`
    INSERT INTO user_boards (user_id, locations, tickers, teams, note, updated_at)
    VALUES (
      ${next.userId},
      ${JSON.stringify(next.locations)}::jsonb,
      ${JSON.stringify(next.tickers)}::jsonb,
      ${JSON.stringify(next.teams)}::jsonb,
      ${next.note},
      ${next.updatedAt}::timestamptz
    )
    ON CONFLICT (user_id) DO UPDATE SET
      locations = EXCLUDED.locations,
      tickers = EXCLUDED.tickers,
      teams = EXCLUDED.teams,
      note = EXCLUDED.note,
      updated_at = EXCLUDED.updated_at
  `;

  return next;
}

import { cache } from "react";
import { fallbackContent } from "@/lib/fallback-content";
import type {
  Applet,
  AppletKind,
  PlatformContent,
  SportsLeague,
  SportsTeam,
  StockTicker,
  WeatherPlace,
} from "@/lib/types";
import { client } from "@/sanity/lib/client";
import { platformContentQuery } from "@/sanity/lib/queries";

type SanityPayload = {
  settings?: {
    title?: string | null;
    tagline?: string | null;
    footerNote?: string | null;
  } | null;
  applets?: Array<{
    _id: string;
    title?: string | null;
    slug?: string | null;
    icon?: string | null;
    description?: string | null;
    kind?: string | null;
    status?: string | null;
  }> | null;
  locations?: Array<{
    id: string;
    name?: string | null;
    state?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    isDefault?: boolean | null;
  }> | null;
  tickers?: Array<{
    id: string;
    symbol?: string | null;
    name?: string | null;
    isDefault?: boolean | null;
  }> | null;
  teams?: Array<{
    id: string;
    name?: string | null;
    abbreviation?: string | null;
    league?: string | null;
    isDefault?: boolean | null;
  }> | null;
};

function readKind(kind: string | null | undefined): AppletKind {
  if (kind === "weather" || kind === "stocks" || kind === "sports") {
    return kind;
  }
  return "placeholder";
}

function readLeague(league: string | null | undefined): SportsLeague | null {
  if (league === "nba" || league === "nfl" || league === "mlb" || league === "nhl") {
    return league;
  }
  return null;
}

function normalize(payload: SanityPayload | null): PlatformContent | null {
  if (!payload) return null;

  const applets = (payload.applets ?? [])
    .filter((applet) => applet.title && applet.slug)
    .map(
      (applet): Applet => ({
        _id: applet._id,
        title: applet.title!,
        slug: applet.slug!,
        icon: applet.icon || "•",
        description: applet.description || "",
        kind: readKind(applet.kind),
        status: applet.status === "live" ? "live" : "comingSoon",
      }),
    );

  const locations = (payload.locations ?? [])
    .filter(
      (place) =>
        place.name &&
        typeof place.latitude === "number" &&
        typeof place.longitude === "number",
    )
    .map(
      (place): WeatherPlace => ({
        id: place.id,
        name: place.name!,
        state: place.state?.trim() || "",
        country: place.country || "",
        latitude: place.latitude!,
        longitude: place.longitude!,
        isDefault: Boolean(place.isDefault),
      }),
    );

  const tickers = (payload.tickers ?? [])
    .filter((ticker) => ticker.symbol)
    .map(
      (ticker): StockTicker => ({
        id: ticker.id,
        symbol: ticker.symbol!.trim().toUpperCase(),
        name: ticker.name || ticker.symbol!.trim().toUpperCase(),
        isDefault: Boolean(ticker.isDefault),
      }),
    );

  const teams: SportsTeam[] = [];
  for (const team of payload.teams ?? []) {
    const league = readLeague(team.league);
    if (!team.name || !team.abbreviation || !league) continue;
    teams.push({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation.trim().toUpperCase(),
      league,
      isDefault: Boolean(team.isDefault),
    });
  }

  return {
    settings: {
      title: payload.settings?.title || fallbackContent.settings.title,
      tagline: payload.settings?.tagline || fallbackContent.settings.tagline,
      footerNote:
        payload.settings?.footerNote || fallbackContent.settings.footerNote,
    },
    applets: applets.length > 0 ? applets : fallbackContent.applets,
    locations: locations.length > 0 ? locations : fallbackContent.locations,
    tickers: tickers.length > 0 ? tickers : fallbackContent.tickers,
    teams: teams.length > 0 ? teams : fallbackContent.teams,
    fromSanity: true,
  };
}

export const getPlatformContent = cache(async (): Promise<PlatformContent> => {
  if (!client) {
    return fallbackContent;
  }

  try {
    const payload = await client.fetch<SanityPayload>(platformContentQuery);
    return normalize(payload) ?? fallbackContent;
  } catch {
    return fallbackContent;
  }
});

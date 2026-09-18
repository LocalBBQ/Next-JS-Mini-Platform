import type {
  Applet,
  PlatformContent,
  SportsTeam,
  StockTicker,
  WeatherPlace,
} from "@/lib/types";

export const fallbackContent: PlatformContent = {
  settings: {
    title: "Home Board",
    tagline:
      "A personal board for running applets. Weather, stocks, and sports are live.",
    footerNote: "Home Board · Next.js · Sanity · Vercel",
  },
  applets: [
    {
      _id: "weather",
      title: "Weather",
      slug: "weather",
      icon: "⛅",
      description: "Live conditions and a 7-day outlook for any city.",
      kind: "weather",
      status: "live",
    },
    {
      _id: "stocks",
      title: "Stocks",
      slug: "stocks",
      icon: "📈",
      description: "Quotes and a one-day sparkline for a curated watchlist.",
      kind: "stocks",
      status: "live",
    },
    {
      _id: "sports",
      title: "Sports",
      slug: "sports",
      icon: "🏟️",
      description: "NBA, NFL, MLB, and NHL scores for featured teams.",
      kind: "sports",
      status: "live",
    },
  ] satisfies Applet[],
  locations: [
    {
      id: "new-york",
      name: "New York",
      state: "NY",
      country: "United States",
      latitude: 40.7128,
      longitude: -74.006,
      isDefault: true,
    },
    {
      id: "london",
      name: "London",
      state: "England",
      country: "United Kingdom",
      latitude: 51.5074,
      longitude: -0.1278,
    },
    {
      id: "tokyo",
      name: "Tokyo",
      country: "Japan",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    {
      id: "los-angeles",
      name: "Los Angeles",
      state: "CA",
      country: "United States",
      latitude: 34.0522,
      longitude: -118.2437,
    },
  ] satisfies WeatherPlace[],
  tickers: [
    { id: "aapl", symbol: "AAPL", name: "Apple", isDefault: true },
    { id: "msft", symbol: "MSFT", name: "Microsoft" },
    { id: "nvda", symbol: "NVDA", name: "NVIDIA" },
    { id: "googl", symbol: "GOOGL", name: "Alphabet" },
  ] satisfies StockTicker[],
  teams: [
    {
      id: "knicks",
      name: "Knicks",
      abbreviation: "NYK",
      league: "nba",
      isDefault: true,
    },
    { id: "chiefs", name: "Chiefs", abbreviation: "KC", league: "nfl" },
    { id: "yankees", name: "Yankees", abbreviation: "NYY", league: "mlb" },
    { id: "rangers", name: "Rangers", abbreviation: "NYR", league: "nhl" },
  ] satisfies SportsTeam[],
  fromSanity: false,
};

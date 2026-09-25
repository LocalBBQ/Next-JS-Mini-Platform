export type AppletKind = "weather" | "stocks" | "sports" | "settings" | "placeholder";
export type BoardTheme = "brutal" | "glass" | "runner";

export function isBoardTheme(value: string | null): value is BoardTheme {
  return value === "brutal" || value === "glass" || value === "runner";
}
export type AppletStatus = "live" | "comingSoon";
export type SportsLeague = "nba" | "nfl" | "mlb" | "nhl";

export type PlatformSettings = {
  title: string;
  tagline: string;
  footerNote: string;
};

export type Applet = {
  _id: string;
  title: string;
  slug: string;
  icon: string;
  description: string;
  kind: AppletKind;
  status: AppletStatus;
};

export type WeatherPlace = {
  id: string;
  name: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
};

export type StockTicker = {
  id: string;
  symbol: string;
  name: string;
  isDefault?: boolean;
};

export type SportsTeam = {
  id: string;
  name: string;
  abbreviation: string;
  league: SportsLeague;
  isDefault?: boolean;
};

export type PlatformContent = {
  settings: PlatformSettings;
  applets: Applet[];
  locations: WeatherPlace[];
  tickers: StockTicker[];
  teams: SportsTeam[];
  fromSanity: boolean;
};

export type BoardUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type UserBoard = {
  userId: string;
  locations: WeatherPlace[];
  tickers: StockTicker[];
  teams: SportsTeam[];
  note: string;
  updatedAt: string;
};

export type WeatherSnapshot = {
  place: WeatherPlace;
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    isDay: boolean;
    time: string;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
    precipitationProbability: number;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    temperatureMax: number;
    temperatureMin: number;
    precipitationProbability: number;
  }>;
};

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  points: number[];
};

export type SportsCompetitor = {
  name: string;
  abbreviation: string;
  score: string;
  winner: boolean;
  logo: string;
};

export type SportsGame = {
  id: string;
  name: string;
  shortName: string;
  date: string;
  state: "pre" | "in" | "post";
  status: string;
  featured: boolean;
  home: SportsCompetitor;
  away: SportsCompetitor;
};

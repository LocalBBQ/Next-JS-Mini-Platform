import type { WeatherPlace, WeatherSnapshot } from "./types";

type OpenMeteoForecast = {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
    weather_code: number;
    is_day: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

type OpenMeteoGeocode = {
  results?: Array<{
    id: number;
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
};

export type WeatherCondition = {
  label: string;
  theme: "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
};

export function describeWeather(code: number): WeatherCondition {
  if (code === 0) return { label: "Clear", theme: "clear" };
  if (code <= 2) return { label: "Partly cloudy", theme: "cloudy" };
  if (code === 3) return { label: "Overcast", theme: "cloudy" };
  if (code === 45 || code === 48) return { label: "Fog", theme: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", theme: "rain" };
  if (code >= 61 && code <= 67) return { label: "Rain", theme: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", theme: "snow" };
  if (code >= 80 && code <= 82) return { label: "Showers", theme: "rain" };
  if (code >= 85 && code <= 86) return { label: "Snow showers", theme: "snow" };
  if (code >= 95) return { label: "Thunderstorm", theme: "storm" };
  return { label: "Mixed", theme: "cloudy" };
}

export function toFahrenheit(celsius: number) {
  return celsius * (9 / 5) + 32;
}

export function formatTemp(celsius: number, unit: "f" | "c") {
  const value = unit === "c" ? celsius : toFahrenheit(celsius);
  return `${Math.round(value)}°`;
}

export function placeLabel(place: Pick<WeatherPlace, "name" | "state" | "country">) {
  const parts = [place.name];
  const state = place.state?.trim();
  const country = place.country?.trim();

  if (state && state !== place.name) parts.push(state);
  if (country && country !== state && country !== place.name) parts.push(country);

  return parts.join(", ");
}

export function parseForecast(
  payload: OpenMeteoForecast,
  place: WeatherPlace,
): WeatherSnapshot {
  if (!payload.current || !payload.hourly || !payload.daily) {
    throw new Error("Weather payload was incomplete.");
  }

  const now = new Date(payload.current.time).getTime();
  const hourly = payload.hourly.time
    .map((time, index) => ({
      time,
      temperature: payload.hourly!.temperature_2m[index],
      weatherCode: payload.hourly!.weather_code[index],
      precipitationProbability:
        payload.hourly!.precipitation_probability[index] ?? 0,
    }))
    .filter((hour) => new Date(hour.time).getTime() >= now)
    .slice(0, 12);

  const daily = payload.daily.time.slice(0, 7).map((date, index) => ({
    date,
    weatherCode: payload.daily!.weather_code[index],
    temperatureMax: payload.daily!.temperature_2m_max[index],
    temperatureMin: payload.daily!.temperature_2m_min[index],
    precipitationProbability:
      payload.daily!.precipitation_probability_max[index] ?? 0,
  }));

  return {
    place,
    current: {
      temperature: payload.current.temperature_2m,
      apparentTemperature: payload.current.apparent_temperature,
      humidity: payload.current.relative_humidity_2m,
      windSpeed: payload.current.wind_speed_10m,
      precipitation: payload.current.precipitation,
      weatherCode: payload.current.weather_code,
      isDay: payload.current.is_day === 1,
      time: payload.current.time,
    },
    hourly,
    daily,
  };
}

export function parseGeocode(payload: OpenMeteoGeocode): WeatherPlace[] {
  return (payload.results ?? []).map((result) => ({
    id: String(result.id),
    name: result.name,
    state: result.admin1 && result.admin1 !== result.name ? result.admin1 : "",
    country: result.country || "",
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

export function forecastUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "precipitation",
      "weather_code",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function geocodeUrl(name: string) {
  const params = new URLSearchParams({
    name,
    count: "6",
    language: "en",
    format: "json",
  });

  return `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
}

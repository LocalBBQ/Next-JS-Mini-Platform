"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GlassScrollArea } from "@/components/GlassScrollArea";
import type { WeatherPlace, WeatherSnapshot } from "@/lib/types";
import { describeWeather, formatTemp, placeLabel } from "@/lib/weather";

type Unit = "f" | "c";

function hourLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
  }).format(new Date(iso));
}

function weekdayLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(`${iso}T12:00:00`));
}

export function WeatherApplet({
  title = "Weather",
  locations,
}: {
  title?: string;
  locations: WeatherPlace[];
}) {
  const defaultPlace = locations.find((place) => place.isDefault) ?? locations[0];
  const [place, setPlace] = useState<WeatherPlace>(defaultPlace);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [unit, setUnit] = useState<Unit>("f");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<WeatherPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setMessage("");

      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        name: place.name,
        state: place.state ?? "",
        country: place.country,
        id: place.id,
      });

      try {
        const response = await fetch(`/api/weather?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Could not load weather.");
        }

        setWeather(payload);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Could not load weather.",
        );
      }
    }

    void load();
    return () => controller.abort();
  }, [place]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/geocode?name=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const payload = await response.json();
        setSuggestions(payload.results ?? []);
        setOpen(true);
      } catch {
        if (controller.signal.aborted) return;
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const condition = useMemo(
    () =>
      weather
        ? describeWeather(weather.current.weatherCode)
        : { label: "Loading", theme: "cloudy" as const },
    [weather],
  );

  const theme = weather?.current.isDay === false && condition.theme === "clear"
    ? "night"
    : condition.theme;

  function choosePlace(next: WeatherPlace) {
    setPlace(next);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        choosePlace({
          id: "here",
          name: "Current location",
          state: "",
          country: "",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setMessage("Location permission was declined.");
      },
    );
  }

  return (
    <section
      className={`weather-applet weather-applet--${theme}`}
      aria-labelledby="weather-heading"
    >
      <div className="weather-atmosphere" aria-hidden="true" />

      <header className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="applet-kicker text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
            Running applet
          </p>
          <h2 id="weather-heading" className="mt-2 font-sans text-2xl text-neutral-900">
            {title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="glass-track inline-flex rounded-full p-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                unit === "f" ? "glass-chip is-active" : "text-neutral-900/80"
              }`}
              onClick={() => setUnit("f")}
            >
              °F
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                unit === "c" ? "glass-chip is-active" : "text-neutral-900/80"
              }`}
              onClick={() => setUnit("c")}
            >
              °C
            </button>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="glass-chip rounded-full px-3 py-2 text-sm text-neutral-900/85 transition hover:bg-yellow-300"
          >
            Use my location
          </button>
        </div>
      </header>

      <div ref={boxRef} className="relative z-20 mt-6">
        <label className="sr-only" htmlFor="city-search">
          Search for a city
        </label>
        <input
          id="city-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search any city"
          className="glass-input w-full rounded-2xl px-4 py-3 text-neutral-900 outline-none placeholder:text-neutral-900/45 focus:border-neutral-900"
        />
        {open && suggestions.length > 0 ? (
          <ul className="glass-menu absolute top-full z-30 mt-2 w-full overflow-hidden rounded-2xl">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm text-neutral-900/90 transition hover:bg-yellow-300"
                  onClick={() => choosePlace(suggestion)}
                >
                  {placeLabel(suggestion)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {locations.map((item) => {
          const active = item.id === place.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => choosePlace(item)}
              className={`glass-chip rounded-full px-3 py-1.5 text-sm transition ${
                active ? "is-active" : "text-neutral-900/85 hover:bg-yellow-300"
              }`}
            >
              {item.state ? `${item.name}, ${item.state}` : item.name}
            </button>
          );
        })}
      </div>

      <div className="relative z-10 mt-8 min-h-48">
        {status === "loading" ? (
          <p className="text-neutral-900/70">Fetching the latest conditions…</p>
        ) : null}
        {status === "error" ? (
          <p className="text-amber-100">{message}</p>
        ) : null}
        {status === "ready" && weather ? (
          <>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-neutral-900/70">{placeLabel(weather.place)}</p>
                <p className="mt-2 text-7xl font-light tracking-tight text-neutral-900 sm:text-8xl">
                  {formatTemp(weather.current.temperature, unit)}
                </p>
                <p className="mt-2 text-xl text-neutral-900/85">{condition.label}</p>
                <p className="mt-1 text-sm text-neutral-900/60">
                  Feels like {formatTemp(weather.current.apparentTemperature, unit)}
                </p>
              </div>

              <dl className="grid grid-cols-3 gap-4 text-sm text-neutral-900/80 md:min-w-80">
                <div>
                  <dt className="text-neutral-900/50">Humidity</dt>
                  <dd className="mt-1 text-lg text-neutral-900">
                    {Math.round(weather.current.humidity)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-900/50">Wind</dt>
                  <dd className="mt-1 text-lg text-neutral-900">
                    {Math.round(weather.current.windSpeed)} mph
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-900/50">Precip</dt>
                  <dd className="mt-1 text-lg text-neutral-900">
                    {weather.current.precipitation.toFixed(1)} in
                  </dd>
                </div>
              </dl>
            </div>

            <GlassScrollArea className="mt-8" axis="x">
              <div className="flex min-w-max gap-3">
                {weather.hourly.map((hour) => (
                  <div
                    key={hour.time}
                    className="glass-card w-20 rounded-2xl px-3 py-4 text-center"
                  >
                    <p className="text-xs text-neutral-900/55">{hourLabel(hour.time)}</p>
                    <p className="mt-2 text-lg text-neutral-900">
                      {formatTemp(hour.temperature, unit)}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-900/50">
                      {hour.precipitationProbability}%
                    </p>
                  </div>
                ))}
              </div>
            </GlassScrollArea>

            <div className="mt-6 divide-y divide-neutral-900">
              {weather.daily.map((day, index) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between py-3 text-sm text-neutral-900/85"
                >
                  <p className="w-16">{index === 0 ? "Today" : weekdayLabel(day.date)}</p>
                  <p className="flex-1 text-neutral-900/60">
                    {describeWeather(day.weatherCode).label}
                  </p>
                  <p className="w-28 text-right">
                    {formatTemp(day.temperatureMax, unit)} /{" "}
                    {formatTemp(day.temperatureMin, unit)}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

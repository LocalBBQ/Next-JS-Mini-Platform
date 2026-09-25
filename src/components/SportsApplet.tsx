"use client";

import { useEffect, useRef, useState } from "react";
import { PinChip, PinToggle } from "@/components/PinControls";
import { teamKey, useBoardPins } from "@/lib/board-pins";
import { formatGameTime, SPORTS_LEAGUES } from "@/lib/sports";
import type { SportsGame, SportsLeague, SportsTeam } from "@/lib/types";

const LEAGUES = Object.keys(SPORTS_LEAGUES) as SportsLeague[];

function TeamSide({
  team,
  align,
}: {
  team: SportsGame["home"];
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {team.logo ? (
        // ESPN hosts these logos; a plain img avoids extra image-domain config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo} alt="" className="h-9 w-9 shrink-0 rounded-full border-2 border-neutral-900 bg-white" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 bg-white text-xs">
          {team.abbreviation}
        </span>
      )}
      <div className="min-w-0">
        <p className={`truncate ${team.winner ? "text-neutral-900" : "text-neutral-900/80"}`}>
          {team.name}
        </p>
        <p className="text-2xl font-light text-neutral-900">{team.score}</p>
      </div>
    </div>
  );
}

export function SportsApplet({
  title = "Sports",
  teams,
}: {
  title?: string;
  teams: SportsTeam[];
}) {
  const pins = useBoardPins();
  const personal = pins.personal;
  const chips = personal ? pins.teams : teams;
  const defaultTeam = teams.find((team) => team.isDefault) ?? teams[0] ?? null;
  const [league, setLeague] = useState<SportsLeague>(defaultTeam?.league ?? "nba");
  const [featured, setFeatured] = useState<SportsTeam | null>(personal ? null : defaultTeam);
  const [games, setGames] = useState<SportsGame[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SportsTeam[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pins.ready) return;
    const fallback = personal ? pins.teams : teams;
    setFeatured((current) => {
      if (current) return current;
      return fallback.find((item) => item.isDefault) ?? fallback[0] ?? null;
    });
  }, [pins.ready, personal, pins.teams, teams]);

  useEffect(() => {
    if (featured) setLeague(featured.league);
  }, [featured]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setMessage("");

      const params = new URLSearchParams({ league });
      if (featured?.abbreviation) {
        params.set("team", featured.abbreviation);
      }

      try {
        const response = await fetch(`/api/sports?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Could not load scores.");
        }

        setGames(payload.games ?? []);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not load scores.");
      }
    }

    void load();
    return () => controller.abort();
  }, [league, featured?.abbreviation]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/sports/search?q=${encodeURIComponent(query.trim())}`,
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

  function chooseLeague(next: SportsLeague) {
    setLeague(next);
    setFeatured(chips.find((team) => team.league === next) ?? null);
  }

  function unpin(team: SportsTeam) {
    if (featured && teamKey(featured) === teamKey(team)) {
      const remaining = chips.filter((item) => teamKey(item) !== teamKey(team));
      setFeatured(remaining.find((item) => item.league === league) ?? remaining[0] ?? null);
    }
    pins.unpinTeam(team);
  }

  function chooseTeam(next: SportsTeam) {
    setFeatured(next);
    setLeague(next.league);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <section
      className={`sports-applet sports-applet--${league}`}
      aria-labelledby="sports-heading"
    >
      <header className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="applet-kicker text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
            Running applet
          </p>
          <h2 id="sports-heading" className="mt-2 font-sans text-2xl text-neutral-900">
            {title}
          </h2>
        </div>
        <p className="text-sm text-neutral-900/60">Scores via ESPN</p>
      </header>

      <div className="glass-track relative z-10 mt-6 inline-flex rounded-full p-1">
        {LEAGUES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => chooseLeague(item)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              league === item ? "glass-chip is-active" : "text-neutral-900/80"
            }`}
          >
            {SPORTS_LEAGUES[item].label}
          </button>
        ))}
      </div>

      <div ref={boxRef} className="relative z-20 mt-4">
        <label className="sr-only" htmlFor="team-search">
          Search for a team
        </label>
        <input
          id="team-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search Lakers, Chiefs, Yankees"
          className="glass-input w-full rounded-2xl px-4 py-3 text-neutral-900 outline-none placeholder:text-neutral-900/45 focus:border-neutral-900"
        />
        {open && suggestions.length > 0 ? (
          <ul className="glass-menu absolute top-full z-30 mt-2 w-full overflow-hidden rounded-2xl">
            {suggestions.map((suggestion) => {
              const pinned = pins.teams.some((item) => teamKey(item) === teamKey(suggestion));
              return (
                <li key={suggestion.id} className="flex items-center gap-2 px-2 py-1">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-between px-2 py-2 text-left text-sm text-neutral-900/90 transition hover:bg-yellow-300"
                    onClick={() => chooseTeam(suggestion)}
                  >
                    <span className="truncate">{suggestion.name}</span>
                    <span className="pl-3 text-neutral-900/55">
                      {SPORTS_LEAGUES[suggestion.league].label}
                    </span>
                  </button>
                  <PinToggle
                    pinned={pinned}
                    label={suggestion.name}
                    disabled={pins.saving}
                    onToggle={() => (pinned ? unpin(suggestion) : pins.pinTeam(suggestion))}
                  />
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {featured && !pins.teams.some((item) => teamKey(item) === teamKey(featured)) ? (
        <div className="relative z-10 mt-4">
          <PinToggle
            pinned={false}
            label={featured.name}
            disabled={pins.saving || (personal && !pins.ready)}
            onToggle={() => pins.pinTeam(featured)}
          />
        </div>
      ) : null}

      {pins.error ? <p className="relative z-10 mt-3 text-sm text-amber-800">{pins.error}</p> : null}

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {personal && !pins.ready ? (
          <p className="text-sm text-neutral-900/60">Loading your teams…</p>
        ) : null}
        {personal && pins.ready && chips.length === 0 ? (
          <p className="text-sm text-neutral-900/70">Search for a team and pin it to this board.</p>
        ) : null}
        {chips.map((item) => (
          <PinChip
            key={item.id}
            active={featured ? teamKey(item) === teamKey(featured) : false}
            label={item.name}
            onOpen={() => chooseTeam(item)}
            onUnpin={personal ? () => unpin(item) : undefined}
          />
        ))}
      </div>

      <div className="relative z-10 mt-8 min-h-48">
        {status === "loading" ? (
          <p className="text-neutral-900/70">Fetching the latest scores…</p>
        ) : null}
        {status === "error" ? <p className="text-amber-100">{message}</p> : null}
        {status === "ready" && games.length === 0 ? (
          <p className="text-neutral-900/70">
            No {SPORTS_LEAGUES[league].label} games on the board right now.
          </p>
        ) : null}
        {status === "ready" ? (
          <div className="grid gap-3">
            {games.map((game) => (
              <article
                key={game.id}
                className={`glass-card rounded-3xl px-4 py-4 ${
                  game.featured ? "is-featured" : ""
                }`}
              >
                <div className="mb-3 flex items-center justify-between text-xs tracking-wide text-neutral-900/55 uppercase">
                  <span>{game.featured ? "Featured" : game.shortName}</span>
                  <span>
                    {game.state === "pre" ? formatGameTime(game.date) : game.status}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <TeamSide team={game.away} align="left" />
                  <p className="text-xs text-neutral-900/40">@</p>
                  <TeamSide team={game.home} align="right" />
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

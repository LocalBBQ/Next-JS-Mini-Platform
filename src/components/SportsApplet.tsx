"use client";

import { useEffect, useState } from "react";
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
      className={`flex min-w-0 items-center gap-2 sm:gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {team.logo ? (
        // ESPN hosts these logos; a plain img avoids extra image-domain config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo} alt="" className="h-8 w-8 shrink-0 rounded-full border-2 border-neutral-900 bg-white sm:h-9 sm:w-9" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 bg-white text-xs sm:h-9 sm:w-9">
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
  const defaultTeam = teams.find((team) => team.isDefault) ?? teams[0] ?? null;
  const [league, setLeague] = useState<SportsLeague>(defaultTeam?.league ?? "nba");
  const [featured, setFeatured] = useState<SportsTeam | null>(defaultTeam);
  const [games, setGames] = useState<SportsGame[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

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

  function chooseLeague(next: SportsLeague) {
    setLeague(next);
    setFeatured(teams.find((team) => team.league === next) ?? null);
  }

  function chooseTeam(next: SportsTeam) {
    setFeatured(next);
    setLeague(next.league);
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

      <div className="glass-track relative z-10 mt-6 flex w-full rounded-full p-1 sm:inline-flex sm:w-auto">
        {LEAGUES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => chooseLeague(item)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm transition sm:flex-none ${
              league === item ? "glass-chip is-active" : "text-neutral-900/80"
            }`}
          >
            {SPORTS_LEAGUES[item].label}
          </button>
        ))}
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {teams.map((item) => {
          const active = item.id === featured?.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseTeam(item)}
              className={`glass-chip rounded-full px-3 py-1.5 text-sm transition ${
                active ? "is-active" : "text-neutral-900/85 hover:bg-yellow-300"
              }`}
            >
              {item.name}
            </button>
          );
        })}
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
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
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

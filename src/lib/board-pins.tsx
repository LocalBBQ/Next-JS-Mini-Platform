"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { stashPendingPin, takePendingPin } from "@/lib/pending-pin";
import { fetchUserBoard, persistUserBoard } from "@/lib/user-board-client";
import type { BoardUser, SportsTeam, StockTicker, UserBoard, WeatherPlace } from "@/lib/types";

const MAX_PINS = 40;

type PinLists = Pick<UserBoard, "locations" | "tickers" | "teams">;

type BoardPinsValue = {
  signedIn: boolean;
  ready: boolean;
  saving: boolean;
  error: string;
  locations: WeatherPlace[];
  tickers: StockTicker[];
  teams: SportsTeam[];
  pinLocation: (place: WeatherPlace) => void;
  unpinLocation: (place: WeatherPlace) => void;
  pinTicker: (ticker: StockTicker) => void;
  unpinTicker: (ticker: StockTicker) => void;
  pinTeam: (team: SportsTeam) => void;
  unpinTeam: (team: SportsTeam) => void;
};

const EMPTY: PinLists = { locations: [], tickers: [], teams: [] };

const BoardPinsContext = createContext<BoardPinsValue | null>(null);

export function placeKey(place: WeatherPlace) {
  if (place.id && place.id !== "here") return place.id;
  return `${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`;
}

export function tickerKey(ticker: StockTicker) {
  return ticker.symbol.trim().toUpperCase();
}

export function teamKey(team: SportsTeam) {
  return `${team.league}-${team.abbreviation.trim().toUpperCase()}`;
}

/** Use a saved list only after it has pins. An empty list keeps the shared catalog. */
export function preferSaved<T>(signedIn: boolean, ready: boolean, saved: T[], shared: T[]) {
  const owned = signedIn && ready && saved.length > 0;
  return { items: owned ? saved : shared, owned };
}

function stablePlace(place: WeatherPlace): WeatherPlace {
  return {
    id: placeKey(place),
    name: place.name,
    state: place.state || undefined,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function stableTicker(ticker: StockTicker): StockTicker {
  const symbol = tickerKey(ticker);
  return {
    id: symbol,
    symbol,
    name: ticker.name.trim() || symbol,
  };
}

function stableTeam(team: SportsTeam): SportsTeam {
  const abbreviation = team.abbreviation.trim().toUpperCase();
  return {
    id: teamKey(team),
    name: team.name.trim(),
    abbreviation,
    league: team.league,
  };
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const next: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(item);
  }
  return next;
}

function catalogPlaces(places: WeatherPlace[]) {
  return uniqueBy(
    places.map((place) => ({ ...stablePlace(place), isDefault: Boolean(place.isDefault) })),
    (place) => place.id,
  );
}

function catalogTickers(tickers: StockTicker[]) {
  return uniqueBy(
    tickers.map((ticker) => ({ ...stableTicker(ticker), isDefault: Boolean(ticker.isDefault) })),
    (ticker) => ticker.symbol,
  );
}

function catalogTeams(teams: SportsTeam[]) {
  return uniqueBy(
    teams.map((team) => ({ ...stableTeam(team), isDefault: Boolean(team.isDefault) })),
    (team) => team.id,
  );
}

/** First save copies the shared catalog so a new pin does not replace those defaults. */
function inheritList<T>(existing: T[], shared: T[], next: T, key: (item: T) => string) {
  const base = existing.length > 0 ? existing : shared;
  if (base.some((item) => key(item) === key(next))) {
    return existing.length > 0 ? null : base;
  }
  if (base.length >= MAX_PINS) return "full" as const;
  return [...base, next];
}

export function BoardPinsProvider({
  user,
  defaults = EMPTY,
  children,
}: {
  user: BoardUser | null;
  defaults?: PinLists;
  children: ReactNode;
}) {
  const [lists, setLists] = useState<PinLists>(EMPTY);
  const [ready, setReady] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const listsRef = useRef(lists);
  const defaultsRef = useRef(defaults);
  const savingRef = useRef(false);
  listsRef.current = lists;
  defaultsRef.current = defaults;

  useEffect(() => {
    if (!user) {
      listsRef.current = EMPTY;
      setLists(EMPTY);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    setError("");

    fetchUserBoard()
      .then((board) => {
        if (cancelled) return;
        const next = board
          ? { locations: board.locations, tickers: board.tickers, teams: board.teams }
          : EMPTY;
        listsRef.current = next;
        setLists(next);
        setReady(true);
      })
      .catch((loadError) => {
        if (cancelled) return;
        listsRef.current = EMPTY;
        setLists(EMPTY);
        setError(loadError instanceof Error ? loadError.message : "Could not load your board.");
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const commit = useCallback(
    async (update: Partial<PinLists>) => {
      if (!user) {
        window.location.assign("/signin");
        return;
      }
      if (savingRef.current) return;

      savingRef.current = true;
      const previous = listsRef.current;
      const optimistic = { ...previous, ...update };
      listsRef.current = optimistic;
      setLists(optimistic);
      setSaving(true);
      setError("");

      try {
        const next = await persistUserBoard(update);
        const saved = {
          locations: next.locations,
          tickers: next.tickers,
          teams: next.teams,
        };
        listsRef.current = saved;
        setLists(saved);
      } catch (saveError) {
        listsRef.current = previous;
        setLists(previous);
        setError(saveError instanceof Error ? saveError.message : "Could not save your board.");
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [user],
  );

  const pinLocation = useCallback(
    (place: WeatherPlace) => {
      const nextPlace = { ...stablePlace(place), isDefault: false };
      if (!user) {
        stashPendingPin({ kind: "location", item: nextPlace });
        window.location.assign("/signin");
        return;
      }
      const next = inheritList(
        listsRef.current.locations,
        catalogPlaces(defaultsRef.current.locations),
        nextPlace,
        (item) => item.id,
      );
      if (!next) return;
      if (next === "full") {
        setError("You can pin up to 40 cities.");
        return;
      }
      void commit({ locations: next });
    },
    [commit, user],
  );

  const unpinLocation = useCallback(
    (place: WeatherPlace) => {
      const id = placeKey(place);
      const next = listsRef.current.locations.filter((item) => item.id !== id);
      if (next[0] && !next.some((item) => item.isDefault)) next[0] = { ...next[0], isDefault: true };
      void commit({ locations: next });
    },
    [commit],
  );

  const pinTicker = useCallback(
    (ticker: StockTicker) => {
      const nextTicker = { ...stableTicker(ticker), isDefault: false };
      if (!user) {
        stashPendingPin({ kind: "ticker", item: nextTicker });
        window.location.assign("/signin");
        return;
      }
      const next = inheritList(
        listsRef.current.tickers,
        catalogTickers(defaultsRef.current.tickers),
        nextTicker,
        (item) => item.symbol,
      );
      if (!next) return;
      if (next === "full") {
        setError("You can pin up to 40 stocks.");
        return;
      }
      void commit({ tickers: next });
    },
    [commit, user],
  );

  const unpinTicker = useCallback(
    (ticker: StockTicker) => {
      const symbol = tickerKey(ticker);
      const next = listsRef.current.tickers.filter((item) => tickerKey(item) !== symbol);
      if (next[0] && !next.some((item) => item.isDefault)) next[0] = { ...next[0], isDefault: true };
      void commit({ tickers: next });
    },
    [commit],
  );

  const pinTeam = useCallback(
    (team: SportsTeam) => {
      const nextTeam = { ...stableTeam(team), isDefault: false };
      if (!user) {
        stashPendingPin({ kind: "team", item: nextTeam });
        window.location.assign("/signin");
        return;
      }
      const next = inheritList(
        listsRef.current.teams,
        catalogTeams(defaultsRef.current.teams),
        nextTeam,
        (item) => item.id,
      );
      if (!next) return;
      if (next === "full") {
        setError("You can pin up to 40 teams.");
        return;
      }
      void commit({ teams: next });
    },
    [commit, user],
  );

  useEffect(() => {
    if (!user || !ready) return;
    const pending = takePendingPin();
    if (!pending) return;
    if (pending.kind === "location") pinLocation(pending.item);
    if (pending.kind === "ticker") pinTicker(pending.item);
    if (pending.kind === "team") pinTeam(pending.item);
  }, [user, ready, pinLocation, pinTicker, pinTeam]);

  const unpinTeam = useCallback(
    (team: SportsTeam) => {
      const id = teamKey(team);
      const next = listsRef.current.teams.filter((item) => teamKey(item) !== id);
      if (next[0] && !next.some((item) => item.isDefault)) next[0] = { ...next[0], isDefault: true };
      void commit({ teams: next });
    },
    [commit],
  );

  const value: BoardPinsValue = {
    signedIn: Boolean(user),
    ready,
    saving,
    error,
    locations: lists.locations,
    tickers: lists.tickers,
    teams: lists.teams,
    pinLocation,
    unpinLocation,
    pinTicker,
    unpinTicker,
    pinTeam,
    unpinTeam,
  };

  return <BoardPinsContext.Provider value={value}>{children}</BoardPinsContext.Provider>;
}

export function useBoardPins() {
  const value = useContext(BoardPinsContext);
  if (!value) {
    throw new Error("useBoardPins must be used inside BoardPinsProvider.");
  }
  return value;
}

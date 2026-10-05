"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PinChip, PinToggle } from "@/components/PinControls";
import { preferSaved, tickerKey, useBoardPins } from "@/lib/board-pins";
import { formatChange, formatPrice } from "@/lib/stocks";
import type { StockQuote, StockTicker } from "@/lib/types";

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) return null;

  const width = 220;
  const height = 64;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / span) * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-16 w-full max-w-xs"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={up ? "#047857" : "#be123c"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StocksApplet({
  title = "Stocks",
  tickers,
}: {
  title?: string;
  tickers: StockTicker[];
}) {
  const pins = useBoardPins();
  const saved = preferSaved(pins.signedIn, pins.ready, pins.tickers, tickers);
  const chips = saved.items;
  const [selected, setSelected] = useState<StockTicker | null>(
    tickers.find((ticker) => ticker.isDefault) ?? tickers[0] ?? null,
  );
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockTicker[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pins.ready) return;
    const savedTickers = pins.tickers;
    if (pins.signedIn && savedTickers.length > 0) {
      setSelected((current) => {
        if (current && savedTickers.some((item) => tickerKey(item) === tickerKey(current))) {
          return current;
        }
        return savedTickers.find((item) => item.isDefault) ?? savedTickers[0] ?? null;
      });
      return;
    }
    setSelected(
      (current) => current ?? tickers.find((item) => item.isDefault) ?? tickers[0] ?? null,
    );
  }, [pins.ready, pins.signedIn, pins.tickers, tickers]);

  useEffect(() => {
    const symbols = [
      ...new Set(
        [selected?.symbol, ...chips.map((ticker) => ticker.symbol)].filter(Boolean) as string[],
      ),
    ];

    if (symbols.length === 0) {
      setQuotes([]);
      setStatus("ready");
      setMessage("");
      return;
    }

    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setMessage("");

      try {
        const response = await fetch(`/api/stocks?symbols=${symbols.join(",")}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Could not load quotes.");
        }

        setQuotes(payload.quotes ?? []);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not load quotes.");
      }
    }

    void load();
    return () => controller.abort();
  }, [selected?.symbol, chips]);

  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(query.trim())}`,
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

  const quote = useMemo(() => {
    const match = quotes.find((item) => item.symbol === selected?.symbol) ?? quotes[0];
    if (!match) return null;
    const named = chips.find((ticker) => ticker.symbol === match.symbol);
    return { ...match, name: named?.name || match.name };
  }, [quotes, selected, chips]);
  const up = (quote?.change ?? 0) >= 0;

  function chooseTicker(next: StockTicker) {
    setSelected(next);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <section
      className={`stocks-applet ${up ? "stocks-applet--up" : "stocks-applet--down"}`}
      aria-labelledby="stocks-heading"
    >
      <header className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="applet-kicker text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
            Running applet
          </p>
          <h2 id="stocks-heading" className="mt-2 font-sans text-2xl text-neutral-900">
            {title}
          </h2>
        </div>
        <p className="text-sm text-neutral-900/60">Quotes via Yahoo Finance</p>
      </header>

      <div ref={boxRef} className="relative z-20 mt-6">
        <label className="sr-only" htmlFor="ticker-search">
          Search for a ticker
        </label>
        <input
          id="ticker-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search AAPL, Microsoft, NVDA"
          className="glass-input w-full rounded-2xl px-4 py-3 text-neutral-900 outline-none placeholder:text-neutral-900/45 focus:border-neutral-900"
        />
        {open && suggestions.length > 0 ? (
          <ul className="glass-menu absolute top-full z-30 mt-2 w-full overflow-hidden rounded-2xl">
            {suggestions.map((suggestion) => {
              const pinned = pins.tickers.some((item) => tickerKey(item) === tickerKey(suggestion));
              return (
              <li key={suggestion.symbol} className="flex items-center gap-2 px-2 py-1">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center justify-between px-2 py-2 text-left text-sm text-neutral-900/90 transition hover:bg-yellow-300"
                  onClick={() => chooseTicker(suggestion)}
                >
                  <span className="font-medium">{suggestion.symbol}</span>
                  <span className="truncate pl-3 text-neutral-900/55">{suggestion.name}</span>
                </button>
                <PinToggle
                  pinned={pinned}
                  label={suggestion.symbol}
                  disabled={pins.saving}
                  onToggle={() =>
                    pinned ? pins.unpinTicker(suggestion) : pins.pinTicker(suggestion)
                  }
                />
              </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {selected && !pins.tickers.some((item) => tickerKey(item) === tickerKey(selected)) ? (
        <div className="relative z-10 mt-4">
          <PinToggle
            pinned={false}
            label={selected.symbol}
            disabled={pins.saving}
            onToggle={() => pins.pinTicker(selected)}
          />
        </div>
      ) : null}

      {pins.error ? <p className="relative z-10 mt-3 text-sm text-amber-800">{pins.error}</p> : null}

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {chips.map((item) => (
          <PinChip
            key={item.id}
            active={tickerKey(item) === (selected ? tickerKey(selected) : "")}
            label={item.symbol}
            onOpen={() => chooseTicker(item)}
            onUnpin={saved.owned ? () => pins.unpinTicker(item) : undefined}
          />
        ))}
      </div>

      <div className="relative z-10 mt-8 min-h-48">
        {status === "loading" ? (
          <p className="text-neutral-900/70">Fetching the latest quotes…</p>
        ) : null}
        {status === "error" ? <p className="text-amber-800">{message}</p> : null}
        {status === "ready" && quote ? (
          <>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-neutral-900/70">
                  {quote.symbol} · {quote.name}
                </p>
                <p className="mt-2 text-7xl font-light tracking-tight text-neutral-900 sm:text-8xl">
                  {formatPrice(quote.price, quote.currency)}
                </p>
                <p className={`mt-2 text-xl ${up ? "text-emerald-700" : "text-rose-700"}`}>
                  {formatChange(quote.change, quote.changePercent)}
                </p>
              </div>
              <Sparkline points={quote.points} up={up} />
            </div>

            <div className="mt-8 divide-y divide-neutral-900">
              {quotes.map((item) => {
                const itemUp = item.change >= 0;
                const displayName =
                  chips.find((ticker) => ticker.symbol === item.symbol)?.name ||
                  item.name;
                return (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() =>
                      chooseTicker({
                        id: item.symbol,
                        symbol: item.symbol,
                        name: displayName,
                      })
                    }
                    className="flex w-full items-center justify-between py-3 text-left text-sm text-neutral-900/85 transition hover:text-neutral-900"
                  >
                    <span className="w-20 font-medium">{item.symbol}</span>
                    <span className="flex-1 truncate text-neutral-900/55">{displayName}</span>
                    <span className="w-24 text-right">
                      {formatPrice(item.price, item.currency)}
                    </span>
                    <span
                      className={`w-28 text-right ${
                        itemUp ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {item.changePercent >= 0 ? "+" : ""}
                      {item.changePercent.toFixed(2)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

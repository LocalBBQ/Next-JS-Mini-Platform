"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const defaultTicker = tickers.find((ticker) => ticker.isDefault) ?? tickers[0];
  const [selected, setSelected] = useState<StockTicker | null>(defaultTicker ?? null);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockTicker[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const symbols = [
      ...new Set(
        [selected?.symbol, ...tickers.map((ticker) => ticker.symbol)].filter(
          Boolean,
        ) as string[],
      ),
    ];

    if (symbols.length === 0) {
      setStatus("error");
      setMessage("Add a stock ticker in Studio to start this applet.");
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
  }, [selected?.symbol, tickers]);

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
    const named = tickers.find((ticker) => ticker.symbol === match.symbol);
    return { ...match, name: named?.name || match.name };
  }, [quotes, selected, tickers]);
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
            {suggestions.map((suggestion) => (
              <li key={suggestion.symbol}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-neutral-900/90 transition hover:bg-yellow-300"
                  onClick={() => chooseTicker(suggestion)}
                >
                  <span className="font-medium">{suggestion.symbol}</span>
                  <span className="text-neutral-900/55">{suggestion.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        {tickers.map((item) => {
          const active = item.symbol === selected?.symbol;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseTicker(item)}
              className={`glass-chip rounded-full px-3 py-1.5 text-sm transition ${
                active ? "is-active" : "text-neutral-900/85 hover:bg-yellow-300"
              }`}
            >
              {item.symbol}
            </button>
          );
        })}
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
                <p className="mt-2 text-5xl font-light tracking-tight text-neutral-900 sm:text-7xl md:text-8xl">
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
                  tickers.find((ticker) => ticker.symbol === item.symbol)?.name ||
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
                    <span className="w-16 shrink-0 font-medium sm:w-20">{item.symbol}</span>
                    <span className="hidden min-w-0 flex-1 truncate text-neutral-900/55 sm:block">
                      {displayName}
                    </span>
                    <span className="ml-auto w-20 shrink-0 text-right sm:w-24">
                      {formatPrice(item.price, item.currency)}
                    </span>
                    <span
                      className={`w-20 shrink-0 text-right sm:w-28 ${
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

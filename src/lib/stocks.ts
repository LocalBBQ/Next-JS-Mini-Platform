import type { StockQuote, StockTicker } from "./types";

const YAHOO_HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

const YAHOO_HOSTS = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
];

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        symbol?: string;
        shortName?: string;
        longName?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: { description?: string } | null;
  };
};

type YahooSearch = {
  quotes?: Array<{
    symbol?: string;
    shortname?: string;
    longname?: string;
    quoteType?: string;
  }>;
};

export function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

export function isValidSymbol(value: string) {
  return /^[A-Z0-9.^+=-]{1,12}$/.test(normalizeSymbol(value));
}

export function parseSymbols(value: string | null, fallback: string[] = []) {
  const symbols = (value || "")
    .split(",")
    .map(normalizeSymbol)
    .filter(isValidSymbol)
    .slice(0, 8);

  return symbols.length > 0 ? [...new Set(symbols)] : fallback;
}

async function fetchYahoo(path: string) {
  let lastError = "Yahoo Finance did not respond.";

  for (const host of YAHOO_HOSTS) {
    const response = await fetch(`${host}${path}`, {
      headers: YAHOO_HEADERS,
      next: { revalidate: 60, tags: ["stocks"] },
    });

    if (response.ok) {
      return response.json();
    }

    lastError = `Yahoo Finance returned ${response.status}.`;
  }

  throw new Error(lastError);
}

export function parseQuote(payload: YahooChart, ticker: StockTicker): StockQuote {
  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  const price = meta?.regularMarketPrice;
  const previousClose = meta?.previousClose ?? meta?.chartPreviousClose;

  if (!meta || typeof price !== "number" || typeof previousClose !== "number") {
    throw new Error(`No quote available for ${ticker.symbol}.`);
  }

  const points = (result?.indicators?.quote?.[0]?.close ?? []).filter(
    (value): value is number => typeof value === "number",
  );

  return {
    symbol: meta.symbol || ticker.symbol,
    name: ticker.name || meta.shortName || meta.longName || ticker.symbol,
    price,
    previousClose,
    change: price - previousClose,
    changePercent: previousClose === 0 ? 0 : ((price - previousClose) / previousClose) * 100,
    currency: meta.currency || "USD",
    points,
  };
}

export function parseSearch(payload: YahooSearch): StockTicker[] {
  const allowed = new Set(["EQUITY", "ETF", "INDEX"]);

  return (payload.quotes ?? [])
    .filter(
      (quote) =>
        quote.symbol &&
        isValidSymbol(quote.symbol) &&
        (!quote.quoteType || allowed.has(quote.quoteType)),
    )
    .slice(0, 6)
    .map((quote) => ({
      id: normalizeSymbol(quote.symbol!),
      symbol: normalizeSymbol(quote.symbol!),
      name: quote.shortname || quote.longname || quote.symbol!,
    }));
}

export async function fetchQuote(ticker: StockTicker): Promise<StockQuote> {
  const symbol = encodeURIComponent(ticker.symbol);
  const payload = (await fetchYahoo(
    `/v8/finance/chart/${symbol}?interval=15m&range=1d`,
  )) as YahooChart;
  return parseQuote(payload, ticker);
}

export async function searchTickers(query: string): Promise<StockTicker[]> {
  const params = new URLSearchParams({
    q: query,
    quotesCount: "8",
    newsCount: "0",
    listsCount: "0",
  });
  const payload = (await fetchYahoo(`/v1/finance/search?${params.toString()}`)) as YahooSearch;
  return parseSearch(payload);
}

export function formatPrice(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatChange(value: number, percent: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

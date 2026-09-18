import { NextRequest, NextResponse } from "next/server";
import { fetchQuote, parseSymbols } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  const symbols = parseSymbols(request.nextUrl.searchParams.get("symbols"));

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "At least one ticker symbol is required." },
      { status: 400 },
    );
  }

  const settled = await Promise.allSettled(
    symbols.map((symbol) => fetchQuote({ id: symbol, symbol, name: "" })),
  );

  const quotes = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (quotes.length === 0) {
    return NextResponse.json(
      { error: "Could not load quotes for those symbols." },
      { status: 502 },
    );
  }

  return NextResponse.json({ quotes });
}

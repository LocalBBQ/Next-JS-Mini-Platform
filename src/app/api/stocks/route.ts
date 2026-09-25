import { NextRequest } from "next/server";
import { jsonError } from "@/lib/route";
import { fetchQuote, parseSymbols } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  const symbols = parseSymbols(request.nextUrl.searchParams.get("symbols"));

  if (symbols.length === 0) {
    return jsonError("At least one ticker symbol is required.", 400);
  }

  try {
    const settled = await Promise.allSettled(
      symbols.map((symbol) => fetchQuote({ id: symbol, symbol, name: "" })),
    );

    const quotes = settled.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    if (quotes.length === 0) {
      return jsonError("Could not load quotes for those symbols.", 502);
    }

    return Response.json({ quotes });
  } catch {
    return jsonError("Could not load quotes for those symbols.", 502);
  }
}

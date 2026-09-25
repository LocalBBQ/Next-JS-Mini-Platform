import type { UserBoard } from "@/lib/types";

export async function fetchUserBoard() {
  const response = await fetch("/api/me/board");
  if (response.status === 401) return null;
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Could not load your board.");
  }
  return payload as UserBoard;
}

export async function persistUserBoard(update: {
  locations?: UserBoard["locations"];
  tickers?: UserBoard["tickers"];
  teams?: UserBoard["teams"];
  note?: string;
}) {
  const response = await fetch("/api/me/board", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Could not save your board.");
  }
  return payload as UserBoard;
}

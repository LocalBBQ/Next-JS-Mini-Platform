"use client";

import Link from "next/link";
import type { BoardUser } from "@/lib/types";

export function AuthControls({
  enabled,
  user,
}: {
  enabled: boolean;
  user: BoardUser | null;
}) {
  if (!enabled) return null;

  if (!user) {
    return (
      <Link href="/signin" className="home-board-studio">
        Sign in
      </Link>
    );
  }

  return <span className="home-board-user">{user.name || "Signed in"}</span>;
}

"use client";

import { signIn } from "next-auth/react";
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
      <button
        type="button"
        className="home-board-studio"
        onClick={() => signIn("github")}
      >
        Sign in
      </button>
    );
  }

  return <span className="home-board-user">{user.name || "Signed in"}</span>;
}

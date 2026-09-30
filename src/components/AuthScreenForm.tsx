"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import type { AuthScreen } from "@/lib/types";

export function AuthScreenForm({
  screen,
  authEnabled,
}: {
  screen: AuthScreen;
  authEnabled: boolean;
}) {
  function continueWithGitHub() {
    void signIn("github", { callbackUrl: "/" });
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        className="glass-button rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
        disabled={!authEnabled}
        onClick={continueWithGitHub}
      >
        {screen.signUpLabel}
      </button>
      <button
        type="button"
        className="glass-chip rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
        disabled={!authEnabled}
        onClick={continueWithGitHub}
      >
        {screen.signInLabel}
      </button>
      <Link
        href="/"
        className="mt-1 text-center text-sm text-neutral-900/70 underline-offset-2 hover:underline"
      >
        {screen.browseLabel}
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import type { AuthScreen } from "@/lib/types";

type Mode = "signup" | "signin";

const fieldClass =
  "glass-input mt-2 w-full rounded-2xl px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-900/45 focus:border-neutral-900";

export function AuthScreenForm({
  screen,
  githubEnabled,
  passwordEnabled,
}: {
  screen: AuthScreen;
  githubEnabled: boolean;
  passwordEnabled: boolean;
}) {
  const [mode, setMode] = useState<Mode>("signup");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const showGitHub = githubEnabled || !passwordEnabled;

  function continueWithGitHub() {
    void signIn("github", { callbackUrl: "/" });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError("");

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          setError(payload?.error || "Could not create the account.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError(
          mode === "signup"
            ? "Account created, but sign-in failed. Try signing in."
            : "Email or password is incorrect.",
        );
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {passwordEnabled ? (
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          {mode === "signup" ? (
            <label className="text-xs font-medium tracking-[0.18em] text-neutral-900/55 uppercase">
              Name
              <input name="name" autoComplete="name" maxLength={80} className={fieldClass} />
            </label>
          ) : null}
          <label className="text-xs font-medium tracking-[0.18em] text-neutral-900/55 uppercase">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <label className="text-xs font-medium tracking-[0.18em] text-neutral-900/55 uppercase">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={fieldClass}
            />
          </label>
          {mode === "signup" ? (
            <label className="text-xs font-medium tracking-[0.18em] text-neutral-900/55 uppercase">
              Confirm password
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                className={fieldClass}
              />
            </label>
          ) : null}
          {error ? <p className="text-sm text-amber-800">{error}</p> : null}
          <button
            type="submit"
            className="glass-button rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
            disabled={pending}
          >
            {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in with email"}
          </button>
          <button
            type="button"
            className="text-sm text-neutral-900/70 underline-offset-2 hover:underline"
            onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
          </button>
        </form>
      ) : null}

      {showGitHub ? (
        <div className={`flex flex-col gap-3 ${passwordEnabled ? "mt-3" : ""}`}>
          {passwordEnabled ? (
            <p className="text-center text-xs font-medium tracking-[0.18em] text-neutral-900/45 uppercase">
              or
            </p>
          ) : null}
          <button
            type="button"
            className="glass-button rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
            disabled={!githubEnabled}
            onClick={continueWithGitHub}
          >
            {screen.signUpLabel}
          </button>
          <button
            type="button"
            className="glass-chip rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
            disabled={!githubEnabled}
            onClick={continueWithGitHub}
          >
            {screen.signInLabel}
          </button>
        </div>
      ) : null}

      {!passwordEnabled && error ? <p className="text-sm text-amber-800">{error}</p> : null}

      <Link
        href="/"
        className="mt-1 text-center text-sm text-neutral-900/70 underline-offset-2 hover:underline"
      >
        {screen.browseLabel}
      </Link>
    </div>
  );
}

"use client";

import { signOut } from "next-auth/react";
import type { BoardTheme, BoardUser } from "@/lib/types";

const THEMES: Array<{ id: BoardTheme; label: string }> = [
  { id: "brutal", label: "Neo-Brutalist" },
  { id: "glass", label: "Glass" },
  { id: "runner", label: "Runner" },
];

export function SettingsApplet({
  title = "Settings",
  theme,
  onThemeChange,
  user,
}: {
  title?: string;
  theme: BoardTheme;
  onThemeChange: (theme: BoardTheme) => void;
  user: BoardUser | null;
}) {
  return (
    <section className="settings-applet" aria-labelledby="settings-heading">
      <header className="relative z-10">
        <p className="applet-kicker text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
          Running applet
        </p>
        <h2 id="settings-heading" className="mt-2 font-sans text-2xl text-neutral-900">
          {title}
        </h2>
      </header>

      <div className="relative z-10 mt-6">
        <p className="text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
          Theme
        </p>
        <div className="mt-3 flex flex-col items-start gap-2" role="group" aria-label="Theme">
          {THEMES.map((item) => {
            const active = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => onThemeChange(item.id)}
                className={`glass-chip rounded-full px-3 py-1.5 text-sm transition ${
                  active ? "is-active" : "text-neutral-900/85 hover:bg-yellow-300"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {user ? (
        <div className="relative z-10 mt-6">
          <p className="text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
            Account
          </p>
          <button
            type="button"
            className="glass-chip mt-3 rounded-full px-3 py-1.5 text-sm text-neutral-900/85 transition hover:bg-yellow-300"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </section>
  );
}

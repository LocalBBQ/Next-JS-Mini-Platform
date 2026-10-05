"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { AuthControls } from "@/components/AuthControls";
import { ComingSoonApplet } from "@/components/ComingSoonApplet";
import { GlassScrollArea } from "@/components/GlassScrollArea";
import { SettingsApplet } from "@/components/SettingsApplet";
import { SportsApplet } from "@/components/SportsApplet";
import { StocksApplet } from "@/components/StocksApplet";
import { WeatherApplet } from "@/components/WeatherApplet";
import { BoardPinsProvider } from "@/lib/board-pins";
import { isBoardTheme, type Applet, type AppletKind, type BoardTheme, type BoardUser, type PlatformContent } from "@/lib/types";

const STORAGE_KEY = "home-board-layout-v1";
const THEME_KEY = "home-board-theme-v1";
const CARD_WIDTH = 400;
const CARD_MIN_VISIBLE = 72;

type BoardWindowState = {
  id: string;
  open: boolean;
  x: number;
  y: number;
  z: number;
};

function defaultWindows(applets: Applet[], boardWidth: number): BoardWindowState[] {
  const width = Math.min(CARD_WIDTH, Math.max(280, boardWidth - 32));
  const cols = Math.max(1, Math.floor((boardWidth - 24) / (width + 20)));

  return applets.map((applet, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      id: applet._id,
      open: applet.kind !== "settings",
      x: 88 + col * (width + 20),
      y: 88 + row * 36,
      z: index + 1,
    };
  });
}

function mergeWindows(
  applets: Applet[],
  saved: BoardWindowState[] | null,
  boardWidth: number,
): BoardWindowState[] {
  const defaults = defaultWindows(applets, boardWidth);
  if (!saved) return defaults;

  const byId = new Map(saved.map((item) => [item.id, item]));
  return defaults.map((item, index) => {
    const previous = byId.get(item.id);
    return previous ? { ...previous, z: previous.z || index + 1 } : item;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cardWidthFor(boardWidth: number) {
  return Math.min(CARD_WIDTH, Math.max(280, boardWidth - 32));
}

function isInteractive(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("button, a, input, textarea, select, option, .glass-scroll-thumb, .glass-scroll-track"))
  );
}

function persist(layout: BoardWindowState[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

function Glyph({ name }: { name: AppletKind | "menu" | "close" }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "weather":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v1.6M12 19.4V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.6M19.4 12H21M4.9 19.1 6 18M18 6l1.1-1.1" />
        </svg>
      );
    case "stocks":
      return (
        <svg {...props}>
          <path d="M4 16l5.2-5.2 3.6 3.6L20 7" />
          <path d="M15 7h5v5" />
        </svg>
      );
    case "sports":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M5 6.2c3.8 2.6 3.8 9 0 11.6M19 6.2c-3.8 2.6-3.8 9 0 11.6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="6.1" />
          <path d="M12 2.4v2.2M12 19.4v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.4 12h2.2M19.4 12h2.2M4.4 19.6l1.6-1.6M18 6l1.6-1.6" />
        </svg>
      );
    case "close":
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
        </svg>
      );
  }
}

function renderApplet(
  applet: Applet,
  content: PlatformContent,
  theme: BoardTheme,
  onThemeChange: (next: BoardTheme) => void,
  showStudio: boolean,
  user: BoardUser | null,
) {
  if (applet.kind === "settings") {
    return (
      <SettingsApplet
        title={applet.title}
        theme={theme}
        onThemeChange={onThemeChange}
        user={user}
      />
    );
  }

  if (applet.status !== "live") {
    return <ComingSoonApplet applet={applet} showStudio={showStudio} />;
  }

  switch (applet.kind) {
    case "weather":
      return <WeatherApplet title={applet.title} locations={content.locations} />;
    case "stocks":
      return <StocksApplet title={applet.title} tickers={content.tickers} />;
    case "sports":
      return <SportsApplet title={applet.title} teams={content.teams} />;
    default:
      return <ComingSoonApplet applet={applet} showStudio={showStudio} />;
  }
}

const BoardFrame = memo(function BoardFrame({
  id,
  title,
  item,
  cardWidth,
  children,
  onClose,
  onNode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  id: string;
  title: string;
  item: BoardWindowState;
  cardWidth: number;
  children: React.ReactNode;
  onClose: (id: string) => void;
  onNode: (id: string, node: HTMLElement | null) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>, id: string) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
}) {
  return (
    <article
      ref={(node) => {
        onNode(id, node);
        if (node && !node.dataset.entered) {
          node.classList.add("is-entering");
        }
      }}
      className="board-window"
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        event.currentTarget.classList.remove("is-entering");
        event.currentTarget.dataset.entered = "true";
      }}
      style={{
        width: cardWidth,
        zIndex: item.z,
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
      }}
      onPointerDown={(event) => onPointerDown(event, id)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <header className="board-window-titlebar" aria-label={`Move ${title}`}>
        <h2 className="min-w-0 flex-1 truncate">{title}</h2>
        <button
          type="button"
          className="board-window-close"
          aria-label={`Close ${title}`}
          onClick={() => onClose(id)}
        >
          ×
        </button>
      </header>
      <GlassScrollArea className="board-window-body">{children}</GlassScrollArea>
    </article>
  );
});

export function PlatformShell({
  content,
  sanityConfigured,
  authEnabled,
  user,
  showStudio,
}: {
  content: PlatformContent;
  sanityConfigured: boolean;
  authEnabled: boolean;
  user: BoardUser | null;
  showStudio: boolean;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const windowNodes = useRef(new Map<string, HTMLElement>());
  const layoutRef = useRef<BoardWindowState[]>(defaultWindows(content.applets, 1200));
  const boardSizeRef = useRef({ width: 1200, height: 800 });
  const cardWidthRef = useRef(CARD_WIDTH);
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
    node: HTMLElement;
  } | null>(null);

  const launcherRef = useRef<HTMLElement>(null);
  const [openById, setOpenById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      content.applets.map((applet) => [applet._id, applet.kind !== "settings"] as const),
    ),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<BoardTheme>("brutal");

  useLayoutEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (!isBoardTheme(saved)) return;
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  const applyTheme = useCallback((next: BoardTheme) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(THEME_KEY, next);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
    };
    const onPointer = (event: globalThis.PointerEvent) => {
      const target = event.target as Node;
      if (launcherRef.current && !launcherRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  const applyNodeLayout = useCallback((item: BoardWindowState) => {
    const node = windowNodes.current.get(item.id);
    if (!node) return;
    node.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
    node.style.zIndex = String(item.z);
    node.style.width = `${cardWidthRef.current}px`;
  }, []);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const applySize = () => {
      boardSizeRef.current = {
        width: board.clientWidth,
        height: board.clientHeight,
      };
      cardWidthRef.current = cardWidthFor(board.clientWidth);
      for (const item of layoutRef.current) {
        applyNodeLayout(item);
      }
    };

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as BoardWindowState[]) : null;
      layoutRef.current = mergeWindows(content.applets, saved, board.clientWidth);
    } catch {
      layoutRef.current = defaultWindows(content.applets, board.clientWidth);
    }

    applySize();

    const nextOpen = Object.fromEntries(
      layoutRef.current.map((item) => [item.id, item.open]),
    );
    setOpenById((current) => {
      const same = layoutRef.current.every((item) => current[item.id] === item.open);
      return same ? current : nextOpen;
    });

    const observer = new ResizeObserver(applySize);
    observer.observe(board);
    return () => observer.disconnect();
  }, [applyNodeLayout, content.applets]);

  const onNode = useCallback((id: string, node: HTMLElement | null) => {
    if (node) {
      windowNodes.current.set(id, node);
      const item = layoutRef.current.find((windowItem) => windowItem.id === id);
      if (item) applyNodeLayout(item);
    } else {
      windowNodes.current.delete(id);
    }
  }, [applyNodeLayout]);

  const closeWindow = useCallback((id: string) => {
    layoutRef.current = layoutRef.current.map((item) =>
      item.id === id ? { ...item, open: false } : item,
    );
    persist(layoutRef.current);
    setOpenById((current) =>
      current[id] === false ? current : { ...current, [id]: false },
    );
  }, []);

  const openWindow = useCallback((id: string) => {
    const top = layoutRef.current.reduce((max, item) => Math.max(max, item.z), 0);
    layoutRef.current = layoutRef.current.map((item) =>
      item.id === id ? { ...item, open: true, z: top + 1 } : item,
    );
    persist(layoutRef.current);
    setOpenById((current) =>
      current[id] === true ? current : { ...current, [id]: true },
    );
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0 || isInteractive(event.target)) return;
    if (
      !(event.target instanceof Element) ||
      !event.target.closest(".board-window-titlebar")
    ) {
      return;
    }

    const item = layoutRef.current.find((windowItem) => windowItem.id === id);
    const node = windowNodes.current.get(id);
    if (!item || !node) return;

    const top = layoutRef.current.reduce((max, windowItem) => Math.max(max, windowItem.z), 0);
    const z = item.z > top ? item.z : top + 1;
    item.z = z;
    node.style.zIndex = String(z);

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: item.x,
      origY: item.y,
      moved: false,
      node,
    };
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const width = cardWidthRef.current;
    const size = boardSizeRef.current;
    const maxX = Math.max(8, size.width - width - 8);
    const maxY = Math.max(8, size.height - CARD_MIN_VISIBLE);
    const x = clamp(drag.origX + event.clientX - drag.startX, 8, maxX);
    const y = clamp(drag.origY + event.clientY - drag.startY, 8, maxY);

    if (!drag.moved && (x !== drag.origX || y !== drag.origY)) {
      drag.moved = true;
      drag.node.classList.add("is-dragging");
    }

    const item = layoutRef.current.find((windowItem) => windowItem.id === drag.id);
    if (item) {
      item.x = x;
      item.y = y;
    }
    drag.node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    drag.node.classList.remove("is-dragging");
    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    persist(layoutRef.current);
  }, []);

  return (
    <BoardPinsProvider
      user={user}
      defaults={{
        locations: content.locations,
        tickers: content.tickers,
        teams: content.teams,
      }}
    >
    <div className="home-board-page" data-theme={theme}>
      {showStudio || authEnabled ? (
        <div className="home-board-tools">
          {showStudio ? (
            <Link href="/studio" className="home-board-studio">
              Studio
            </Link>
          ) : null}
          <AuthControls enabled={authEnabled} user={user} />
        </div>
      ) : null}

      <nav
        ref={launcherRef}
        className={`board-launcher ${menuOpen ? "is-open" : ""}`}
        aria-label="Applet menu"
      >
        <button
          type="button"
          className="board-launcher-toggle"
          aria-expanded={menuOpen}
          aria-controls="board-launcher-items"
          aria-label={menuOpen ? "Close applet menu" : "Open applet menu"}
          onClick={() => {
            setMenuOpen((open) => !open);
          }}
        >
          <Glyph name={menuOpen ? "close" : "menu"} />
        </button>
        <div id="board-launcher-items" className="board-launcher-items">
          {content.applets.map((applet) => {
            const open = openById[applet._id] !== false;
            return (
              <button
                key={applet._id}
                type="button"
                className={`board-launcher-item ${open ? "is-open" : ""}`}
                aria-pressed={open}
                aria-label={`${open ? "Close" : "Open"} ${applet.title}`}
                title={applet.title}
                onClick={() => (open ? closeWindow(applet._id) : openWindow(applet._id))}
              >
                <Glyph name={applet.kind === "placeholder" ? "menu" : applet.kind} />
              </button>
            );
          })}
        </div>
      </nav>

      {showStudio && (!sanityConfigured || !content.fromSanity) ? (
        <p className="home-board-banner">
          Using fallback pins. Connect Sanity to edit this board in Studio.
        </p>
      ) : null}

      <div ref={boardRef} className="board-canvas" aria-label="Home Board canvas">
        {content.applets.map((applet) => {
          const item = layoutRef.current.find((windowItem) => windowItem.id === applet._id);
          if (!item || openById[applet._id] === false) return null;

          return (
            <BoardFrame
              key={applet._id}
              id={applet._id}
              title={applet.title}
              item={item}
              cardWidth={cardWidthRef.current}
              onClose={closeWindow}
              onNode={onNode}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {renderApplet(applet, content, theme, applyTheme, showStudio, user)}
            </BoardFrame>
          );
        })}
      </div>
    </div>
    </BoardPinsProvider>
  );
}

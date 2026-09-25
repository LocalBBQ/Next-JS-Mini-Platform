"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="home-board-page route-status">
          <div className="route-status-card">
            <h1>Something went wrong</h1>
            <p>Home Board could not render this page.</p>
            <button type="button" className="route-status-action" onClick={() => retry()}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

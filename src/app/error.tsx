"use client";

import { useEffect } from "react";

export default function ErrorPage({
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
    <div className="home-board-page route-status">
      <div className="route-status-card">
        <h1>Something went wrong</h1>
        <p>Home Board hit an unexpected error while loading this page.</p>
        <button type="button" className="route-status-action" onClick={() => retry()}>
          Try again
        </button>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="home-board-page route-status">
      <div className="route-status-card">
        <h1>Page not found</h1>
        <p>That route is not part of Home Board.</p>
        <Link href="/" className="route-status-action">
          Back to the board
        </Link>
      </div>
    </div>
  );
}

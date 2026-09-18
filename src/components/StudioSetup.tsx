import Link from "next/link";
import { isSanityConfigured } from "@/sanity/env";

export function StudioSetup() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16 text-slate-100">
      <p className="text-sm tracking-[0.2em] text-sky-300 uppercase">Sanity Studio</p>
      <h1 className="mt-3 text-4xl font-semibold">Connect a Sanity project</h1>
      <p className="mt-4 text-slate-300">
        The applets already run without a CMS. Add a Sanity project when you
        want to edit the catalog: titles, live/soon status, cities, tickers, and
        featured teams.
      </p>
      <ol className="mt-8 list-decimal space-y-3 pl-5 text-slate-200">
        <li>
          Create a free project at{" "}
          <a
            className="text-sky-300 underline"
            href="https://www.sanity.io/manage"
            target="_blank"
            rel="noreferrer"
          >
            sanity.io/manage
          </a>
          .
        </li>
        <li>
          Copy <code className="rounded bg-white/10 px-1.5 py-0.5">.env.example</code> to{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">.env.local</code> and
          fill in <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code>.
        </li>
        <li>Restart the Next.js dev server, then reload this page.</li>
      </ol>
      <Link
        href="/"
        className="mt-10 w-fit rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950"
      >
        Back to the platform
      </Link>
      {isSanityConfigured ? (
        <p className="mt-6 text-sm text-emerald-200">Sanity env vars are set.</p>
      ) : null}
    </main>
  );
}

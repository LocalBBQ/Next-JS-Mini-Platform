import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthScreenForm } from "@/components/AuthScreenForm";
import { isAuthConfigured } from "@/lib/auth-env";
import { getAuthScreen } from "@/sanity/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const screen = await getAuthScreen();
  return {
    title: screen.title,
    description: screen.body,
  };
}

export default async function SignInPage() {
  if (isAuthConfigured) {
    const session = await auth();
    if (session?.user?.id) redirect("/");
  }

  const screen = await getAuthScreen();

  return (
    <main className="home-board-page items-center justify-center px-6 py-16">
      <section className="auth-screen" aria-labelledby="auth-heading">
        <p className="text-xs font-medium tracking-[0.22em] text-neutral-900/55 uppercase">
          {screen.kicker}
        </p>
        <h1 id="auth-heading" className="mt-3 font-sans text-4xl leading-tight text-neutral-900">
          {screen.title}
        </h1>
        <p className="mt-4 text-base text-neutral-900/80">{screen.body}</p>
        {screen.points.length > 0 ? (
          <ul className="mt-6 space-y-2 text-sm text-neutral-900/85">
            {screen.points.map((point) => (
              <li key={point} className="border-t-2 border-neutral-900 pt-2">
                {point}
              </li>
            ))}
          </ul>
        ) : null}
        <AuthScreenForm screen={screen} authEnabled={isAuthConfigured} />
        <p className="mt-6 text-sm text-neutral-900/60">
          {isAuthConfigured
            ? screen.footnote
            : "GitHub sign-in is not configured in this environment."}
        </p>
      </section>
    </main>
  );
}

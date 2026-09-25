import type { Metadata } from "next";
import { auth } from "@/auth";
import { PlatformShell } from "@/components/PlatformShell";
import { isAuthConfigured, canSeeStudio } from "@/lib/auth-env";
import { getPlatformContent } from "@/sanity/lib/content";
import { isSanityConfigured } from "@/sanity/env";
import type { BoardUser } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPlatformContent();

  return {
    title: content.settings.title,
    description: content.settings.tagline,
  };
}

async function readBoardUser(): Promise<BoardUser | null> {
  if (!isAuthConfigured) return null;

  try {
    const session = await auth();
    const id = session?.user?.id;
    if (!id) return null;
    return {
      id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const [content, user] = await Promise.all([
    getPlatformContent(),
    readBoardUser(),
  ]);

  return (
    <PlatformShell
      content={content}
      sanityConfigured={isSanityConfigured}
      authEnabled={isAuthConfigured}
      user={user}
      showStudio={canSeeStudio(user)}
    />
  );
}

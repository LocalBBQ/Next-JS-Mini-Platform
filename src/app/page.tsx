import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";
import { getPlatformContent } from "@/sanity/lib/content";
import { isSanityConfigured } from "@/sanity/env";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPlatformContent();

  return {
    title: content.settings.title,
    description: content.settings.tagline,
  };
}

export default async function Home() {
  const content = await getPlatformContent();

  return (
    <PlatformShell content={content} sanityConfigured={isSanityConfigured} />
  );
}

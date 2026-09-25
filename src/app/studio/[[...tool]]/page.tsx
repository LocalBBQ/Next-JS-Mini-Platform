import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";
import { StudioSetup } from "@/components/StudioSetup";
import { isSanityConfigured } from "@/sanity/env";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    return <StudioSetup />;
  }

  return <NextStudio config={config} />;
}

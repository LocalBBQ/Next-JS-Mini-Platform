import { NextStudioLayout } from "next-sanity/studio";
import { requireStudioAdmin } from "@/lib/studio-access";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: LayoutProps<"/studio">) {
  await requireStudioAdmin();
  return <NextStudioLayout>{children}</NextStudioLayout>;
}

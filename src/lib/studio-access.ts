import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canSeeStudio } from "@/lib/auth-env";

export async function requireStudioAdmin() {
  const session = await auth();
  if (!canSeeStudio(session?.user)) {
    redirect("/");
  }
}

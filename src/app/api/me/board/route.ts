import { auth } from "@/auth";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/auth-env";
import { jsonError } from "@/lib/route";
import { getUserBoard, saveUserBoard } from "@/lib/user-board";

async function requireUserId() {
  if (!isAuthConfigured) {
    return { error: jsonError("Auth is not configured.", 503) };
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: jsonError("Sign in to save your board.", 401) };
  }

  if (!isDatabaseConfigured) {
    return { error: jsonError("Postgres is not configured.", 503) };
  }

  return { userId };
}

export async function GET() {
  const result = await requireUserId();
  if ("error" in result) return result.error;

  try {
    const board = await getUserBoard(result.userId);
    return Response.json(board);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not load your board.",
      500,
    );
  }
}

export async function PUT(request: Request) {
  const result = await requireUserId();
  if ("error" in result) return result.error;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Expected JSON.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonError("Expected an object.", 400);
  }

  const body = payload as Record<string, unknown>;

  try {
    const board = await saveUserBoard(result.userId, {
      locations: body.locations,
      tickers: body.tickers,
      teams: body.teams,
      note: body.note,
    });
    return Response.json(board);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not save your board.",
      500,
    );
  }
}

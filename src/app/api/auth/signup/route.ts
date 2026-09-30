import { isPasswordAuthConfigured } from "@/lib/auth-env";
import { jsonError } from "@/lib/route";
import {
  createUser,
  EmailTakenError,
  readEmail,
  readName,
  readPassword,
} from "@/lib/users";

export async function POST(request: Request) {
  if (!isPasswordAuthConfigured) {
    return jsonError("Email sign-up is not configured.", 503);
  }

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
  const email = readEmail(body.email);
  const password = readPassword(body.password);
  const name = readName(body.name);

  if (!email || !password) {
    return jsonError("Use a valid email and a password of at least 8 characters.", 400);
  }
  if (typeof body.name === "string" && body.name.trim() && !name) {
    return jsonError("Name must be 80 characters or fewer.", 400);
  }

  try {
    await createUser({ email, password, name });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return jsonError(error.message, 409);
    }
    return jsonError("Could not create the account.", 500);
  }
}

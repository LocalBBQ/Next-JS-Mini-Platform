export const isAuthConfigured = Boolean(
  process.env.AUTH_SECRET &&
    process.env.AUTH_GITHUB_ID &&
    process.env.AUTH_GITHUB_SECRET,
);

export const isDatabaseConfigured = Boolean(
  process.env.POSTGRES_URL || process.env.DATABASE_URL,
);

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function canSeeStudio(user?: { id?: string | null; email?: string | null } | null) {
  const allow = adminEmails();
  if (allow.length === 0 || !user) return false;

  const email = user.email?.trim().toLowerCase();
  const id = user.id?.trim().toLowerCase();
  return Boolean((email && allow.includes(email)) || (id && allow.includes(id)));
}

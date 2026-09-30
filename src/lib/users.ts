import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { isDatabaseConfigured } from "@/lib/auth-env";
import { hashPassword, verifyPassword } from "@/lib/password";

export class EmailTakenError extends Error {
  constructor() {
    super("An account with that email already exists.");
    this.name = "EmailTakenError";
  }
}

export type PasswordUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
};

let tableReady = false;
let dummyHash: string | null = null;

function databaseUrl() {
  return (process.env.POSTGRES_URL || process.env.DATABASE_URL || "").trim();
}

function sql() {
  const url = databaseUrl();
  if (!url) throw new Error("Postgres is not configured.");
  return neon(url);
}

export function readEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function readPassword(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.length < 8 || value.length > 128) return null;
  return value;
}

export function readName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return null;
  if (name.length > 80) return null;
  return name;
}

export async function ensureUsersTable() {
  if (!isDatabaseConfigured) throw new Error("Postgres is not configured.");
  if (tableReady) return;

  await sql()`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

function fromRow(row: UserRow): PasswordUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
  };
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && String(error.code) === "23505") return true;
  const message = error instanceof Error ? error.message : "";
  return message.includes("duplicate key");
}

export async function findUserByEmail(email: string) {
  const normalized = readEmail(email);
  if (!normalized) return null;
  await ensureUsersTable();
  const rows = (await sql()`
    SELECT id, email, name, password_hash
    FROM users
    WHERE email = ${normalized}
    LIMIT 1
  `) as UserRow[];
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function verifyUserPassword(user: PasswordUser | null, password: string) {
  const stored = user?.passwordHash ?? (dummyHash ??= await hashPassword("unused-password"));
  const valid = await verifyPassword(password, stored);
  return Boolean(user) && valid;
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string | null;
}) {
  await ensureUsersTable();
  const passwordHash = await hashPassword(input.password);
  const id = randomUUID();

  try {
    await sql()`
      INSERT INTO users (id, email, name, password_hash)
      VALUES (${id}, ${input.email}, ${input.name}, ${passwordHash})
    `;
  } catch (error) {
    if (isUniqueViolation(error)) throw new EmailTakenError();
    throw error;
  }

  return { id, email: input.email, name: input.name };
}

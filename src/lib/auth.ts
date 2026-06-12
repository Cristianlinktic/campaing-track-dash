import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "./supabase/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session";

// ── Contraseñas ───────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Login / logout ────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  display_name: string | null;
  role: "admin" | "reader";
}

/**
 * Valida credenciales contra la tabla `users` y, si son correctas, crea la
 * cookie de sesión. Devuelve el usuario o null si las credenciales fallan.
 */
export async function login(
  username: string,
  password: string,
): Promise<SessionPayload | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_user_campaing")
    .select("id, username, password_hash, display_name, role")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle<UserRow>();

  if (error || !data) {
    // Comparamos contra un hash dummy para igualar el tiempo de respuesta
    // y no filtrar si el usuario existe o no (timing attack).
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinv");
    return null;
  }

  const ok = await verifyPassword(password, data.password_hash);
  if (!ok) return null;

  const session = {
    sub: data.id,
    username: data.username,
    name: data.display_name ?? undefined,
    role: data.role ?? "reader",
  } satisfies Parameters<typeof signSession>[0];
  const token = await signSession(session);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return { sub: data.id, username: data.username, name: data.display_name ?? undefined, role: data.role ?? "reader" };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Devuelve la sesión actual (o null) leyendo y verificando la cookie. */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

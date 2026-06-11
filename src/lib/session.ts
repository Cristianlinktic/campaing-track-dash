// Firma/verificación del JWT de sesión con `jose`.
// Módulo "edge-safe": no usa next/headers ni bcrypt, por lo que puede
// importarse tanto desde middleware (edge) como desde el servidor (node).

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "pauta_session";
const ALG = "HS256";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

export interface SessionPayload extends JWTPayload {
  sub: string; // user id
  username: string;
  name?: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta la variable de entorno AUTH_SECRET.");
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: Pick<SessionPayload, "sub" | "username" | "name">,
): Promise<string> {
  return new SignJWT({ username: payload.username, name: payload.name })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;

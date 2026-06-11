"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!username || !password) {
    return { error: "Ingresa usuario y contraseña." };
  }

  let ok = false;
  try {
    const session = await login(username, password);
    ok = Boolean(session);
  } catch {
    return {
      error:
        "No se pudo conectar con la base de datos. Revisa la configuración de Supabase.",
    };
  }

  if (!ok) return { error: "Usuario o contraseña incorrectos." };

  // Evita open-redirect: solo rutas internas.
  redirect(next.startsWith("/") ? next : "/");
}

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase para uso EXCLUSIVO en el servidor.
// Usa la service role key, por lo que ignora RLS. Nunca debe importarse
// desde un componente cliente (el guard "server-only" lo impide en build).

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

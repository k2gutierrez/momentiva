import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Comprueba que quien llama sea administrador.
 *
 * Las Server Actions de Next son alcanzables por POST directo: proteger la página
 * /admin con el proxy NO protege las acciones que esa página usa. Por eso cada
 * acción de administración debe validar el rol aquí, en el servidor.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado: inicia sesión como administrador.");
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    throw new Error("No autorizado: se requiere cuenta de administrador.");
  }

  return user;
}

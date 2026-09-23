import { createClient } from "@/lib/supabase/server";
import { enviarCorreoDePrueba } from "@/lib/correo";

/**
 * Diagnóstico del correo (solo para administradoras).
 *
 * Abrir en el navegador con la sesión de administradora:
 *   https://momentiva.com.mx/api/diagnostico-correo
 *
 * Dice si las variables del servidor de correo están cargadas y manda un correo de
 * prueba, para saber exactamente por qué no está saliendo el correo de los pedidos.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Inicia sesión en la tienda primero." }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.role !== "admin") {
    return Response.json({ error: "Esta revisión es solo para administradoras." }, { status: 403 });
  }

  const destino =
    new URL(request.url).searchParams.get("correo") || perfil?.email || user.email || "";

  const resultado = await enviarCorreoDePrueba(destino);
  return Response.json({ destino, ...resultado });
}

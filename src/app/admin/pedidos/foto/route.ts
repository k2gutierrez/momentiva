import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Las fotos que sube el cliente viven en un bucket PRIVADO. Esta ruta las sirve
// solo a un administrador con sesión, y permite descargarlas como archivo.
// Está bajo /admin, así que además el proxy ya exige rol de administrador.
const BUCKET_CLIENTES = "pedidos-clientes";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const ruta = request.nextUrl.searchParams.get("ruta");
  if (!ruta) {
    return new NextResponse("Falta la ruta del archivo", { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return new NextResponse("El servidor no tiene configurada la llave de servicio", {
      status: 500,
    });
  }

  const { data, error } = await admin.storage.from(BUCKET_CLIENTES).download(ruta);
  if (error || !data) {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }

  const descargar = request.nextUrl.searchParams.get("descargar") === "1";
  const nombre = (ruta.split("/").pop() || "foto.jpg").replace(/[^\w.\-]/g, "_");

  // Solo se muestran en línea los formatos de imagen seguros. Cualquier otro tipo
  // (por ejemplo un SVG, que puede traer scripts) se fuerza a descarga: si se
  // sirviera en línea se ejecutaría en el mismo origen que el panel de admin.
  const tipoCrudo = String(data.type || "").toLowerCase();
  const tiposEnLinea = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const enLinea = tiposEnLinea.includes(tipoCrudo);
  const adjuntar = descargar || !enLinea;

  return new NextResponse(data, {
    headers: {
      "Content-Type": enLinea ? tipoCrudo : "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=300",
      ...(adjuntar
        ? { "Content-Disposition": `attachment; filename="${nombre}"` }
        : {}),
    },
  });
}

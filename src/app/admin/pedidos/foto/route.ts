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
  const nombre = ruta.split("/").pop() || "foto.jpg";

  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "private, max-age=300",
      ...(descargar
        ? { "Content-Disposition": `attachment; filename="${nombre}"` }
        : {}),
    },
  });
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // El optimizador de imágenes SÍ se usa ahora: las fotos se sirven desde el dominio
  // de la tienda con caché de 1 año (antes iban directo a Supabase y cada visita las
  // volvía a descargar, lo que agotó la cuota del plan gratis).
  //
  // Se mantiene protegido: solo se permite optimizar imágenes de NUESTRO propio
  // almacenamiento público; cualquier otra dirección se rechaza. Además el proyecto
  // usa únicamente WebP (sin AVIF) y no permite SVG, que es donde estaban las
  // vulnerabilidades conocidas de sharp/libvips.
  if (request.nextUrl.pathname.startsWith("/_next/image")) {
    const destino = request.nextUrl.searchParams.get("url") || "";
    const esNuestra =
      destino.startsWith("/") ||
      /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(destino);
    if (!esNuestra) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check current session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If trying to access any route starting with /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // 1. If not logged in, redirect to home
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 2. Query user's role from public.profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // 3. If role is not 'admin', block access and redirect to home
    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

// Specify matcher to run middleware on admin routes
export const config = {
  matcher: ["/admin/:path*", "/_next/image"],
};
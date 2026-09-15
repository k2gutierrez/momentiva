import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Feed de productos para el catálogo de Meta (Facebook / Instagram Shopping / anuncios).
// Meta lo lee periódicamente desde esta URL programada.
// Formato: CSV según la especificación de Meta Commerce.

function csvValue(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

// URL base pública del sitio. En producción el servidor puede verse como 0.0.0.0:3000,
// así que preferimos NEXT_PUBLIC_SITE_URL y, si no está, el host real de la petición.
function resolveBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

  if (host && !host.startsWith("0.0.0.0") && !host.startsWith("127.0.0.1")) {
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const origin = resolveBaseUrl(request);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, description, price, images, is_active, is_in_stock_item, stock_quantity")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(`Error generando el feed: ${error.message}`, { status: 500 });
  }

  const header = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "link",
    "image_link",
    "brand",
    "quantity_to_sell_on_facebook",
  ].join(",");

  const rows = (products || []).map((p) => {
    const inStock = p.is_in_stock_item ? Number(p.stock_quantity || 0) > 0 : true;
    const image = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "";

    return [
      csvValue(p.id),
      csvValue(p.name),
      csvValue((p.description || p.name).slice(0, 5000)),
      csvValue(inStock ? "in stock" : "out of stock"),
      csvValue("new"),
      csvValue(`${Number(p.price).toFixed(2)} MXN`),
      csvValue(`${origin}/product/${p.slug}`),
      csvValue(image),
      csvValue("Momentiva"),
      csvValue(p.is_in_stock_item ? String(p.stock_quantity || 0) : "100"),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import CupPreviewer from "@/components/CupPreviewer";
import ComplementosSeccion from "@/components/ComplementosSeccion";
import ComplementosGrid from "@/components/ComplementosGrid";
import ProductOptionsForm from "@/components/ProductOptionsForm";
import ProductTabs from "@/components/ProductTabs";
import ProductGallery from "@/components/ProductGallery";
import Link from "next/link";
import { ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

// 1. En Next.js 15, params es una Promesa, así que lo tipamos como tal
export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const supabase = await createClient();

  // 2. Usamos await para "desenvolver" el slug antes de usarlo
  const { slug } = await params;

  // 3. Consultamos a Supabase con el slug ya extraído
  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, slug, description, price, images, custom_options, is_in_stock_item, stock_quantity, anticipation_days, is_custom_cup, is_active, category:categories(name, slug)")
    .eq("slug", slug)
    .eq("is_active", true) // Lo regresamos porque me confirmas que sí es true
    .single();

  if (error || !product) {
    return (
      <main className="bg-cream min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-10 text-center">
          <div className="bg-white p-10 rounded-3xl shadow-sm max-w-md">
            <h1 className="text-2xl font-bold text-berenjena mb-3">Producto no disponible</h1>
            <p className="text-gray-500 mb-6">
              Este producto ya no está publicado o el enlace cambió. Te invitamos a ver el catálogo actualizado.
            </p>
            <Link
              href="/tienda"
              className="inline-block bg-terracota hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
            >
              Ver la tienda
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  // El join de categoría puede venir como objeto o arreglo según la consulta
  const categoryData = product.category as { name?: string } | { name?: string }[] | null;
  const categoryName = Array.isArray(categoryData)
    ? categoryData[0]?.name
    : categoryData?.name;

  // Complementos ("Complementa tu regalo"):
  // buscamos la categoría por slug y, si no coincide exacto, por nombre parecido
  // (así funciona aunque la creen con un slug ligeramente distinto).
  const { data: categoryList } = await supabase
    .from("categories")
    .select("id, name, slug");

  const complementCategory =
    (categoryList || []).find((c) => c.slug === "complementa-tu-regalo") ||
    (categoryList || []).find((c) =>
      String(c.name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes("complementa")
    ) ||
    (categoryList || []).find((c) =>
      String(c.slug || "").toLowerCase().includes("complement")
    );

  const { data: complementos } = complementCategory
    ? await supabase
        .from("products")
        .select("id, name, slug, price, images, custom_options")
        .eq("category_id", complementCategory.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
    : { data: null };

  // Producto real de la taza personalizada: de ahí salen el id (para que el pedido
  // sea válido) y el precio (editable desde el panel). Si no existe, no se muestra
  // el personalizador para no romper el checkout.
  const { data: tazaRows } = await supabase
    .from("products")
    .select("id, name, slug, price, images")
    .or("slug.eq.taza-personalizada,name.ilike.%taza%")
    .order("created_at", { ascending: true })
    .limit(1);

  const productoTaza = tazaRows?.[0] || null;

  // La taza no se repite como tarjeta: su lugar es el personalizador de arriba
  const complementosFiltrados = (complementos || []).filter(
    (c) => c.id !== productoTaza?.id
  );

  // Fechas bloqueadas para el selector de entrega
  const { data: blockedDatesRows } = await supabase
    .from("blocked_dates")
    .select("blocked_date");
  const blockedDates = (blockedDatesRows || []).map((b) => b.blocked_date);

  return (
    <main className="bg-white min-h-screen flex flex-col">
      <AuthModal />
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-20 w-full flex-grow">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="w-full lg:w-1/2">
            <ProductGallery images={product.images || []} name={product.name} />
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            
            {categoryName && (
              <span className="text-sage font-bold uppercase tracking-widest text-xs mb-3 block">
                {categoryName}
              </span>
            )}
            
            <h1 className="text-3xl md:text-5xl font-bold text-[#3A243F] mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="text-3xl md:text-4xl font-bold text-terracota mb-6">
              ${product.price.toFixed(2)} <span className="text-base text-gray-500 font-normal">MXN</span>
            </div>

            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
              {product.description || "Un detalle inolvidable preparado a mano en Guadalajara."}
            </p>

            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-3 text-sm text-[#3A243F] font-bold">
                <SparkleIcon size={20} className="text-terracota" weight="fill" />
                Globos burbuja con aire (duran semanas, no días).
              </div>
              <div className="flex items-center gap-3 text-sm text-[#3A243F] font-bold">
                <ShieldCheckIcon size={20} className="text-sage" weight="fill" />
                Pago seguro y envío local en ZMG.
              </div>
            </div>

            {/* FORMULARIO DINÁMICO Y BOTÓN DE CARRITO */}
            <ProductOptionsForm 
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                slug: product.slug,
                image: mainImage || "/placeholder.png",
                custom_options: product.custom_options
              }}
              anticipationDays={product.anticipation_days || 0}
              blockedDates={blockedDates}
              tieneComplementos={product.is_custom_cup === true}
            />

          </div>
        </div>
      </section>

      {/* Sección: Complementa tu Regalo */}
      {/* Sección de complementos: se muestra si el producto tiene activado
          "Complementa tu regalo" (columna is_custom_cup, que también habilita el previsualizador de taza) */}
      {product.is_custom_cup === true && (
      <ComplementosSeccion clave={product.slug}>
      <section id="complementa-tu-regalo" className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-sage uppercase tracking-widest block mb-2">
              Complementos especiales
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-[#3A243F]">Complementa tu regalo</h3>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Suma detalles únicos a tu globo: taza personalizada, suculentas, cervezas, pastel, copa de postre y charcutería.
            </p>
          </div>

          {/* Personalizador de Taza: solo si el producto lo tiene habilitado (is_custom_cup) */}
          {/* Personalizador de Taza: la taza se agrega desde aquí (con foto),
              por eso no se repite como tarjeta en la cuadrícula de abajo. */}
          {product.is_custom_cup && productoTaza && (
            <CupPreviewer
              producto={{
                id: productoTaza.id,
                name: productoTaza.name,
                slug: productoTaza.slug,
                price: Number(productoTaza.price),
                image: productoTaza.images?.[0] || null,
              }}
            />
          )}

          {/* Grid de complementos: se agregan con la misma fecha y hora del producto */}
          {complementosFiltrados.length > 0 ? (
            <ComplementosGrid
              complementos={complementosFiltrados.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                price: Number(c.price),
                images: c.images ?? null,
                custom_options: c.custom_options,
              }))}
            />
          ) : (
            <div className="text-center py-10 mt-12 bg-white rounded-2xl border border-dashed border-lilaPastel">
              <p className="text-gray-500 text-sm">
                Muy pronto podrás agregar suculentas, cervezas, pastel, copa de postre y charcutería a tu regalo.
              </p>
            </div>
          )}

        </div>
      </section>
      </ComplementosSeccion>
      )}

      {/* Pestañas: Descripción e Información adicional */}
      <ProductTabs description={product.description || ""} />

      <Footer />
    </main>
  );
}
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import CupPreviewer from "@/components/CupPreviewer";
import ComplementosSeccion from "@/components/ComplementosSeccion";
import { esCategoriaComplementos, esTazaPersonalizada } from "@/lib/complementos";
import ProductOptionsForm from "@/components/ProductOptionsForm";
import ProductTabs from "@/components/ProductTabs";
import ProductGallery from "@/components/ProductGallery";
import Link from "next/link";
import { ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

// 1. En Next.js 15, params es una Promesa, así que lo tipamos como tal
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Si viene ?editar=<id>, la clienta tocó "Editar" en el carrito: se precargan sus
  // opciones y al guardar se REEMPLAZA ese artículo (no se duplica ni se borra).
  const sp = await searchParams;
  const editarId = typeof sp?.editar === "string" ? sp.editar : undefined;

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
  // Un producto de la categoría "Complementa tu regalo" no ofrece más complementos:
  // es un agregado, no un regalo que los acepte. Así, aunque alguien active la casilla
  // por error, la ficha no muestra la pregunta ni la lista.
  const categoriaDelProducto = Array.isArray(product.category)
    ? product.category[0]
    : product.category;
  const esProductoComplemento = esCategoriaComplementos(
    categoriaDelProducto?.slug,
    categoriaDelProducto?.name
  );
  // La taza siempre se puede personalizar (aunque la casilla de complementos esté
  // apagada): su configurador es lo que la define.
  // Inventario agotado: se muestra un aviso notorio y no se puede comprar.
  const sinStock =
    Boolean(product.is_in_stock_item) && Number(product.stock_quantity || 0) <= 0;

  const esTazaDelProducto = esTazaPersonalizada(product);
  const tituloPersonalizacion = esTazaDelProducto ? "Personaliza tu taza" : "Personaliza tu regalo";

  // Título propio cuando la página ES un complemento (ahí no se ofrecen más
  // complementos: la sección sirve para personalizarlo).

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
            {sinStock && (
              <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-center">
                <p className="text-lg font-extrabold text-red-600 tracking-wide">
                  SIN STOCK
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Este producto se agotó por el momento. Escríbenos por WhatsApp y te
                  avisamos en cuanto vuelva a estar disponible. 💜
                </p>
              </div>
            )}

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
              tieneComplementos={product.is_custom_cup === true && !esProductoComplemento}
              editarId={editarId}
              sinStock={sinStock}
            />

          </div>
        </div>
      </section>

      {/* Sección de personalización: SOLO en la página del propio complemento (la taza).
          En los productos normales los complementos ya no se muestran aquí: se ofrecen
          en un modal al agregar al carrito (estilo enviaflores). */}
      {esProductoComplemento && (product.is_custom_cup === true || esTazaPersonalizada(product)) && (
      <ComplementosSeccion clave={product.slug} siempreVisible={esProductoComplemento}>
      <section id="complementa-tu-regalo" className="bg-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-bold text-sage uppercase tracking-widest block mb-2">
              {esProductoComplemento ? "Personalízalo" : "Complementos especiales"}
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-[#3A243F]">
              {esProductoComplemento ? tituloPersonalizacion : "Complementa tu regalo"}
            </h3>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              {esProductoComplemento
                ? "Elige el diseño y súmalo a tu pedido junto con tu globo."
                : "Suma detalles únicos a tu globo: taza personalizada, suculentas, cervezas, pastel, copa de postre y charcutería."}
            </p>
          </div>

          {/* Personalizador de Taza: solo si el producto lo tiene habilitado (is_custom_cup) */}
          {/* Personalizador de Taza: la taza se agrega desde aquí (con foto),
              por eso no se repite como tarjeta en la cuadrícula de abajo. */}
          {(product.is_custom_cup || esTazaDelProducto) && productoTaza && (
            <CupPreviewer
              producto={{
                id: productoTaza.id,
                name: productoTaza.name,
                slug: productoTaza.slug,
                price: Number(productoTaza.price),
                image: productoTaza.images?.[0] || null,
              }}
              editarId={editarId}
            />
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